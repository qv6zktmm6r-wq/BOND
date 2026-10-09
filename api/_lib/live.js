"use strict";

const crypto = require("node:crypto");

const ROOM_PATTERN = /^bond-[a-z0-9-]{1,40}$/;
const IDENTITY_PATTERN = /^(guest|host)-[a-f0-9]{16}$/;
const TOKEN_TTL_SECONDS = 2 * 60 * 60;
const MIN_HOST_CODE_LENGTH = 12;
const MAX_BODY_BYTES = 4096;

function config() {
  const url = process.env.LIVEKIT_URL || "";
  const apiKey = process.env.LIVEKIT_API_KEY || "";
  const apiSecret = process.env.LIVEKIT_API_SECRET || "";
  if (!/^wss?:\/\//.test(url) || !apiKey || !apiSecret) return null;
  return { url, apiKey, apiSecret, httpUrl: url.replace(/^ws/, "http") };
}

function base64url(value) {
  return Buffer.from(value).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function sign(payload, { apiKey, apiSecret }) {
  const now = Math.floor(Date.now() / 1000);
  const body = { iss: apiKey, nbf: now - 10, exp: now + TOKEN_TTL_SECONDS, ...payload };
  const unsigned = `${base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }))}.${base64url(JSON.stringify(body))}`;
  const signature = crypto.createHmac("sha256", apiSecret).update(unsigned).digest("base64url");
  return `${unsigned}.${signature}`;
}

function verify(token, { apiKey, apiSecret }) {
  if (typeof token !== "string" || token.length > 4096) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    if (JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8")).alg !== "HS256") return null;
  } catch {
    return null;
  }
  const expected = crypto.createHmac("sha256", apiSecret).update(`${parts[0]}.${parts[1]}`).digest();
  const actual = Buffer.from(parts[2], "base64url");
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    const now = Date.now() / 1000;
    if (payload.iss !== apiKey || !(payload.exp > now) || !(payload.nbf <= now)) return null;
    return payload;
  } catch {
    return null;
  }
}

function hostCodeMatches(candidate) {
  const code = process.env.BOND_HOST_CODE || "";
  if (code.length < MIN_HOST_CODE_LENGTH || typeof candidate !== "string" || !candidate) return false;
  const digest = (value) => crypto.createHash("sha256").update(value).digest();
  return crypto.timingSafeEqual(digest(candidate), digest(code));
}

function hostEnabled() {
  return (process.env.BOND_HOST_CODE || "").length >= MIN_HOST_CODE_LENGTH;
}

function cleanName(value, fallback, role) {
  let name = String(value || "").replace(/[\u0000-\u001f\u007f<>()[\]]/g, "").replace(/\s+/g, " ").trim().slice(0, 40);
  if (role === "guest") name = name.replace(/\b(representative|host|moderator|admin|bond staff)\b/gi, "").replace(/\s+/g, " ").trim();
  return name || fallback;
}

function newIdentity(role) {
  return `${role}-${crypto.randomBytes(8).toString("hex")}`;
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

async function handle(req, res, action) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(res, 405, { error: "Use POST." });
  }
  if (!String(req.headers["content-type"] || "").startsWith("application/json")) return send(res, 415, { error: "Send JSON." });
  const settings = config();
  if (!settings) return send(res, 503, { error: "Live audio isn't configured on this deployment." });
  let body;
  try {
    body = await readJson(req);
  } catch {
    return send(res, 400, { error: "Invalid request." });
  }
  if (!body || typeof body !== "object" || !ROOM_PATTERN.test(String(body.room || ""))) return send(res, 400, { error: "Unknown room." });
  try {
    return await action(body, settings);
  } catch {
    return send(res, 502, { error: "The live-audio service didn't respond. Try again." });
  }
}

async function roomService(method, payload, settings) {
  const token = sign({ video: { room: payload.room, roomAdmin: true } }, settings);
  const response = await fetch(`${settings.httpUrl}/twirp/livekit.RoomService/${method}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(8000),
  });
  return response.ok;
}

module.exports = {
  IDENTITY_PATTERN,
  cleanName,
  handle,
  hostCodeMatches,
  hostEnabled,
  newIdentity,
  roomService,
  send,
  sign,
  verify,
};
