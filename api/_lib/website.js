"use strict";

const dns = require("node:dns");
const http = require("node:http");
const https = require("node:https");
const net = require("node:net");
const zlib = require("node:zlib");

const MAX_BODY_BYTES = 2048;
const MAX_HTML_BYTES = 768 * 1024;
const MAX_PARSE_CHARS = 512 * 1024;
const TOTAL_BUDGET_MS = 9000;
const RATE_LIMIT = 12;
const RATE_WINDOW_MS = 60 * 1000;
const MAX_IMAGE_BYTES = 1024 * 1024;
const MAX_REDIRECTS = 3;
const PAGE_TIMEOUT_MS = 6000;
const IMAGE_TIMEOUT_MS = 3500;
const USER_AGENT = "Mozilla/5.0 (compatible; BONDProfileReader/1.0; +https://joinbond.world)";
const CATEGORIES = ["Aerospace & Defense", "Construction", "Engineering", "Manufacturing", "Technology", "Logistics", "Energy", "Professional services"];
const INDUSTRY_WORDS = {
  "Aerospace & Defense": ["aerospace", "defense", "defence", "aviation", "aircraft", "avionics", "satellite", "spacecraft", "military", "dod"],
  Construction: ["construction", "contractor", "contractors", "builder", "builders", "remodeling", "roofing", "concrete", "renovation", "plumbing", "hvac", "excavation", "framing"],
  Engineering: ["engineering", "engineers", "structural", "civil engineering", "mechanical engineering", "surveying", "geotechnical"],
  Manufacturing: ["manufacturing", "manufacturer", "fabrication", "machining", "cnc", "machine shop", "injection molding", "welding", "metalwork", "production line"],
  Technology: ["software", "saas", "cloud", "it services", "technology", "web development", "cybersecurity", "app development", "data analytics", "managed it"],
  Logistics: ["logistics", "freight", "shipping", "trucking", "warehouse", "warehousing", "distribution", "supply chain", "3pl", "courier"],
  Energy: ["energy", "solar", "renewable", "battery storage", "utility", "utilities", "wind power", "ev charging", "power generation"],
  "Professional services": ["consulting", "advisory", "accounting", "law firm", "attorneys", "staffing", "insurance", "marketing agency", "bookkeeping"],
};
const US_STATES = "AL|AK|AZ|AR|CA|CO|CT|DE|DC|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY";

const blocked = new net.BlockList();
for (const [network, prefix] of [["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12],
  ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.88.99.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24], ["203.0.113.0", 24], ["224.0.0.0", 3]]) {
  blocked.addSubnet(network, prefix, "ipv4");
}
// IPv4-mapped IPv6 (::ffff:a.b.c.d) is checked against the IPv4 rules by BlockList itself;
// adding ::ffff:0:0/96 here would block every IPv4 address.
for (const [network, prefix] of [["::", 96], ["::ffff:0:0:0", 96], ["64:ff9b::", 96], ["64:ff9b:1::", 48], ["100::", 64], ["2001::", 23], ["2001:db8::", 32],
  ["2002::", 16], ["fc00::", 7], ["fe80::", 10], ["fec0::", 10], ["ff00::", 8]]) {
  blocked.addSubnet(network, prefix, "ipv6");
}

class PublicError extends Error {}

function isBlockedAddress(address, family) {
  return blocked.check(address, family === 6 || family === "IPv6" ? "ipv6" : "ipv4");
}

// Every connection (including each redirect) resolves through this check, so a hostname
// can't point the fetch at private or internal networks, even if its DNS changes mid-request.
function safeLookup(hostname, options, callback) {
  dns.lookup(hostname, { all: true, verbatim: true }, (error, addresses) => {
    if (error) return callback(error);
    if (!addresses.length || addresses.some(({ address, family }) => address.includes("%") || isBlockedAddress(address, family))) {
      return callback(Object.assign(new Error("blocked address"), { code: "EBLOCKED" }));
    }
    if (options && options.all) return callback(null, addresses);
    return callback(null, addresses[0].address, addresses[0].family);
  });
}

function parseTarget(value) {
  let text = String(value || "").trim();
  if (!text || text.length > 500 || /\s/.test(text)) return null;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(text)) text = `https://${text}`;
  let url;
  try {
    url = new URL(text);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
  if (url.port && !["80", "443"].includes(url.port)) return null;
  // Node connects to IP literals without calling `lookup`, so they never reach safeLookup.
  if (net.isIP(host) || net.isIP(host.replace(/^\[|\]$/g, ""))) return null;
  if (!host.includes(".") || /(^|\.)(localhost|local|internal|home|lan|corp|intranet)$/.test(host)) return null;
  url.hash = "";
  return url;
}

function request(url, { maxBytes, accept, timeout, deadline }) {
  const remaining = Math.min(timeout, deadline - Date.now());
  if (remaining <= 0) return Promise.reject(new Error("timeout"));
  return new Promise((resolve, reject) => {
    const client = url.protocol === "https:" ? https : http;
    let settled = false;
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn(value);
    };
    const req = client.request(url, {
      method: "GET",
      agent: false,
      lookup: safeLookup,
      headers: { "User-Agent": USER_AGENT, Accept: accept, "Accept-Encoding": "gzip, deflate, br", "Accept-Language": "en-US,en;q=0.8" },
    }, (res) => {
      const status = res.statusCode || 0;
      if (status >= 300 && status < 400 && res.headers.location) {
        res.destroy();
        req.destroy();
        return finish(resolve, { redirect: res.headers.location });
      }
      if (status < 200 || status >= 300) {
        res.destroy();
        req.destroy();
        return finish(reject, new Error(`status ${status}`));
      }
      const encoding = String(res.headers["content-encoding"] || "").toLowerCase();
      let stream = res;
      if (encoding === "gzip" || encoding === "x-gzip") stream = res.pipe(zlib.createGunzip());
      else if (encoding === "deflate") stream = res.pipe(zlib.createInflate());
      else if (encoding === "br") stream = res.pipe(zlib.createBrotliDecompress());
      const chunks = [];
      let size = 0;
      stream.on("data", (chunk) => {
        size += chunk.length;
        if (size > maxBytes) {
          req.destroy();
          stream.destroy();
          return finish(reject, new Error("too large"));
        }
        chunks.push(chunk);
      });
      stream.on("end", () => finish(resolve, { body: Buffer.concat(chunks), type: String(res.headers["content-type"] || "").toLowerCase(), url }));
      stream.on("error", (error) => finish(reject, error));
    });
    const timer = setTimeout(() => {
      req.destroy();
      finish(reject, new Error("timeout"));
    }, remaining);
    req.on("error", (error) => finish(reject, error));
    req.end();
  });
}

async function fetchPublic(start, options) {
  let url = start;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const result = await request(url, options);
    if (!result.redirect) return result;
    let next = null;
    try {
      next = parseTarget(new URL(result.redirect, url).href);
    } catch {
      next = null;
    }
    if (!next) throw new Error("bad redirect");
    url = next;
  }
  throw new Error("too many redirects");
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", nbsp: " ", ndash: "–", mdash: "—", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", hellip: "…", trade: "™", reg: "®", copy: "©" };

function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-f]{1,6}|#\d{1,7}|[a-z]{2,8});/gi, (match, entity) => {
    if (entity[0] === "#") {
      const code = entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : "";
    }
    return ENTITIES[entity.toLowerCase()] ?? match;
  });
}

function clean(value, max) {
  return decodeEntities(String(value || "").replace(/<[^<>]{0,2000}>/g, " ")).replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function readAttributes(tag) {
  const result = Object.create(null);
  for (const match of tag.matchAll(/([a-zA-Z_:][-a-zA-Z0-9_:.]{0,60})\s*=\s*(?:"([^"]{0,2000})"|'([^']{0,2000})'|([^\s"'>]{1,2000}))/g)) {
    result[match[1].toLowerCase()] = decodeEntities(match[2] ?? match[3] ?? match[4] ?? "");
  }
  return result;
}

function decodeHtml(body, type) {
  const declared = /charset=([\w-]+)/.exec(type)?.[1] || /<meta[^>]+charset=["']?([\w-]+)/i.exec(body.subarray(0, 4096).toString("latin1"))?.[1] || "utf-8";
  try {
    return new TextDecoder(declared.toLowerCase()).decode(body);
  } catch {
    return new TextDecoder("utf-8").decode(body);
  }
}

function asArray(value) {
  return Array.isArray(value) ? value : value == null ? [] : [value];
}

function structuredNodes(html) {
  const nodes = [];
  const lower = html.toLowerCase();
  const opener = /<script\b[^<>]{0,500}>/g;
  let match;
  while ((match = opener.exec(lower)) && nodes.length < 60) {
    if (!match[0].includes("application/ld+json")) continue;
    const end = lower.indexOf("</script", opener.lastIndex);
    if (end === -1) break;
    const content = html.slice(opener.lastIndex, end);
    opener.lastIndex = end;
    if (content.length > 200000) continue;
    let data;
    try {
      data = JSON.parse(content.trim());
    } catch {
      continue;
    }
    const queue = asArray(data).slice(0, 60);
    while (queue.length && nodes.length < 60) {
      const node = queue.shift();
      if (!node || typeof node !== "object") continue;
      nodes.push(node);
      for (const child of asArray(node["@graph"]).slice(0, 60)) queue.push(child);
    }
  }
  return nodes;
}

function isOrganization(node) {
  return asArray(node["@type"]).some((type) => typeof type === "string" && /organization|business|corporation|company|contractor|store|service|agency|manufacturer/i.test(type));
}

function imageUrl(value) {
  const first = asArray(value)[0];
  if (typeof first === "string") return first;
  if (first && typeof first === "object") return typeof first.url === "string" ? first.url : typeof first.contentUrl === "string" ? first.contentUrl : "";
  return "";
}

function absoluteUrl(value, base) {
  if (!value || typeof value !== "string" || value.startsWith("data:")) return null;
  try {
    return parseTarget(new URL(value.trim(), base).href);
  } catch {
    return null;
  }
}

function lettersOnly(value) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]/g, "");
}

function splitTitle(title, hostname) {
  const parts = title.split(/\s+[|–—·•:»-]\s+/).map((part) => part.trim()).filter((part) => part && !/^(home|homepage|welcome|official site|official website)$/i.test(part));
  if (!parts.length) return { name: "", tagline: "" };
  const domain = lettersOnly(hostname.replace(/^www\./, "").split(".")[0]);
  const named = parts.find((part) => {
    const letters = lettersOnly(part);
    return letters && domain && (letters.includes(domain) || domain.includes(letters) || letters.startsWith(domain.slice(0, 5)));
  });
  const name = named || parts[0];
  const tagline = parts.filter((part) => part !== name).sort((a, b) => b.length - a.length)[0] || "";
  return { name, tagline };
}

function guessIndustry(primary, secondary) {
  const scores = Object.fromEntries(CATEGORIES.map((category) => [category, 0]));
  const count = (text, word) => (text.match(new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g")) || []).length;
  for (const [category, words] of Object.entries(INDUSTRY_WORDS)) {
    for (const word of words) scores[category] += count(primary, word) * 3 + Math.min(count(secondary, word), 4);
  }
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return ranked[0][1] >= 3 && ranked[0][1] > ranked[1][1] ? ranked[0][0] : "";
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value || "");
  } catch {
    return "";
  }
}

function stripBlocks(html) {
  const lower = html.toLowerCase();
  const opener = /<(script|style|noscript|svg|template)\b/g;
  let output = "";
  let position = 0;
  let match;
  while ((match = opener.exec(lower))) {
    output += `${html.slice(position, match.index)} `;
    const end = lower.indexOf(`</${match[1]}`, opener.lastIndex);
    if (end === -1) return output;
    position = end;
    opener.lastIndex = end + 2;
  }
  return output + html.slice(position);
}

function extractProfile(html, pageUrl) {
  const head = html.slice(0, MAX_PARSE_CHARS);
  const meta = Object.create(null);
  for (const match of head.matchAll(/<meta\b[^<>]{0,4000}>/gi)) {
    const attributes = readAttributes(match[0]);
    const key = (attributes.property || attributes.name || attributes.itemprop || "").toLowerCase();
    if (key && attributes.content && !(key in meta)) meta[key] = attributes.content;
  }
  const icons = [];
  for (const match of head.matchAll(/<link\b[^<>]{0,4000}>/gi)) {
    const attributes = readAttributes(match[0]);
    const rel = (attributes.rel || "").toLowerCase();
    if (!attributes.href || !/icon/.test(rel) || /mask-icon/.test(rel) || /\.(svg|ico)(\?|$)/i.test(attributes.href)) continue;
    const size = Math.max(0, ...String(attributes.sizes || "").split(/\s+/).map((entry) => parseInt(entry, 10) || 0));
    icons.push({ href: attributes.href, score: (/apple-touch-icon/.test(rel) ? 1000 : 0) + size });
  }
  icons.sort((a, b) => b.score - a.score);
  const nodes = structuredNodes(head);
  const org = nodes.find(isOrganization) || {};
  const site = nodes.find((node) => asArray(node["@type"]).includes("WebSite")) || {};
  const title = clean(/<title\b[^<>]{0,200}>([^<]{0,500})</i.exec(head)?.[1], 200);
  const split = splitTitle(title, pageUrl.hostname);

  const name = clean(org.name || meta["og:site_name"] || site.name || meta["application-name"] || split.name, 80);
  const longDescription = clean(meta.description || meta["og:description"] || meta["twitter:description"] || org.description, 1200);
  const tagline = clean(org.slogan || (split.tagline && split.tagline !== longDescription ? split.tagline : ""), 100);

  const text = clean(stripBlocks(head), 60000);
  const address = asArray(org.address).find((entry) => entry && typeof entry === "object") || {};
  let location = [clean(address.addressLocality, 60), clean(address.addressRegion, 40)].filter(Boolean).join(", ");
  if (!location) {
    const match = new RegExp(`\\b([A-Z][a-zA-Z.'-]{1,30}(?: [A-Z][a-zA-Z.'-]{1,30}){0,2}),? (${US_STATES}) \\d{5}(?:-\\d{4})?\\b`).exec(text);
    const city = match ? match[1].replace(/^(?:(?:dr|st|ave|rd|blvd|ln|way|ct|pl|pkwy|hwy|suite|ste|unit|floor|fl)\.?\s+)+/i, "") : "";
    if (city.length > 2) location = `${city}, ${match[2]}`;
  }

  const emailCandidate = clean(org.email, 160).replace(/^mailto:/i, "")
    || safeDecode(/href\s*=\s*["']mailto:([^"'?#<>]{1,200})/i.exec(head)?.[1]).trim();
  const email = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,63}$/.test(emailCandidate) ? emailCandidate.slice(0, 160) : "";
  const phoneCandidate = clean(org.telephone, 40) || clean(safeDecode(/href\s*=\s*["']tel:([^"'<>]{1,60})/i.exec(head)?.[1]), 40);
  const phoneDigits = phoneCandidate.replace(/\D/g, "");
  const phone = /^[+()\d.\-\s]+$/.test(phoneCandidate) && phoneDigits.length >= 7 && phoneDigits.length <= 15 ? phoneCandidate : "";

  const services = [];
  const addService = (value) => {
    const item = clean(value, 40);
    if (item && item.length > 2 && item.toLowerCase() !== name.toLowerCase() && !services.some((entry) => entry.toLowerCase() === item.toLowerCase()) && services.length < 6) services.push(item);
  };
  for (const offer of asArray(org.makesOffer)) addService(offer?.itemOffered?.name || offer?.name);
  for (const item of asArray(org.hasOfferCatalog?.itemListElement)) addService(item?.itemOffered?.name || item?.name);
  for (const topic of asArray(org.knowsAbout)) addService(typeof topic === "string" ? topic : topic?.name);
  if (meta.keywords) meta.keywords.split(",").forEach(addService);

  const industry = guessIndustry(`${name} ${title} ${longDescription} ${meta.keywords || ""} ${services.join(" ")}`.toLowerCase(), text.toLowerCase());
  const founded = /^\d{4}/.exec(String(org.foundingDate || ""))?.[0] || "";

  return {
    fields: { name, tagline, description: longDescription, location, email, phone, services, industry, founded },
    logoUrl: absoluteUrl(imageUrl(org.logo) || meta["og:logo"], pageUrl) || absoluteUrl(icons[0]?.href, pageUrl),
    coverUrl: absoluteUrl(meta["og:image"] || meta["og:image:url"] || meta["twitter:image"] || imageUrl(org.image), pageUrl),
  };
}

function sniffImage(buffer) {
  if (buffer.length > 8 && buffer.readUInt32BE(0) === 0x89504e47) return "image/png";
  if (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.length > 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return "";
}

async function fetchImage(url, deadline) {
  if (!url) return "";
  try {
    const result = await fetchPublic(url, { maxBytes: MAX_IMAGE_BYTES, accept: "image/png,image/jpeg,image/webp", timeout: IMAGE_TIMEOUT_MS, deadline });
    const type = sniffImage(result.body);
    return type ? `data:${type};base64,${result.body.toString("base64")}` : "";
  } catch {
    return "";
  }
}

async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body);
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error("too large");
    chunks.push(chunk);
  }
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {};
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.end(JSON.stringify(body));
}

const recentRequests = new Map();

// Best effort only: counts are per serverless instance, not global.
function rateLimited(req) {
  const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "").split(",")[0].trim() || "unknown";
  const now = Date.now();
  const times = (recentRequests.get(ip) || []).filter((time) => now - time < RATE_WINDOW_MS);
  times.push(now);
  recentRequests.set(ip, times);
  if (recentRequests.size > 5000) recentRequests.clear();
  return times.length > RATE_LIMIT;
}

function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return false;
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

async function readWebsite(target) {
  const deadline = Date.now() + TOTAL_BUDGET_MS;
  let page;
  try {
    page = await fetchPublic(target, { maxBytes: MAX_HTML_BYTES, accept: "text/html,application/xhtml+xml", timeout: PAGE_TIMEOUT_MS, deadline });
  } catch (error) {
    if (error.code === "EBLOCKED") throw new PublicError("That address isn't a public website.");
    if (error.code === "ENOTFOUND") throw new PublicError("We couldn't find that website. Check the address.");
    throw new PublicError("We couldn't open that website. Check the address, or fill in the profile yourself.");
  }
  if (!/text\/html|application\/xhtml\+xml/.test(page.type)) throw new PublicError("That address isn't a web page.");
  const profile = extractProfile(decodeHtml(page.body, page.type), page.url);
  const sameImage = profile.logoUrl && profile.coverUrl && profile.logoUrl.href === profile.coverUrl.href;
  const [logo, cover] = await Promise.all([fetchImage(profile.logoUrl, deadline), sameImage ? "" : fetchImage(profile.coverUrl, deadline)]);
  return { source: page.url.hostname.replace(/^www\./, ""), website: `${page.url.origin}/`, fields: profile.fields, images: { logo, cover } };
}

module.exports = { PublicError, extractProfile, parseTarget, rateLimited, readJson, readWebsite, safeLookup, sameOrigin, send };
