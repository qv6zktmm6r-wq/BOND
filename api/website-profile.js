"use strict";

const { PublicError, parseTarget, rateLimited, readJson, readWebsite, sameOrigin, send } = require("./_lib/website");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(res, 405, { error: "Use POST." });
  }
  if (!String(req.headers["content-type"] || "").startsWith("application/json")) return send(res, 415, { error: "Send JSON." });
  if (!sameOrigin(req)) return send(res, 403, { error: "This helper only works from the BOND site." });
  if (rateLimited(req)) return send(res, 429, { error: "Too many website lookups. Wait a minute and try again." });
  let body;
  try {
    body = await readJson(req);
  } catch {
    return send(res, 400, { error: "Invalid request." });
  }
  const target = parseTarget(body && body.url);
  if (!target) return send(res, 400, { error: "Enter a website address like yourcompany.com." });
  try {
    return send(res, 200, await readWebsite(target));
  } catch (error) {
    if (error instanceof PublicError) return send(res, 422, { error: error.message });
    return send(res, 502, { error: "We couldn't read that website right now. Fill in the profile yourself, or try again." });
  }
};
