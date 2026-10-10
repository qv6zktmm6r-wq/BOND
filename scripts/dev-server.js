"use strict";

// Local preview: serves dist/ and the api/ functions the way Vercel does.
// Usage: see "Live audio" in README.md. Use the LiveKit dev server's test keys locally, not real ones.

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..", "dist");
const routes = {
  "/api/live-token": require("../api/live-token"),
  "/api/live-mic": require("../api/live-mic"),
  "/api/website-profile": require("../api/website-profile"),
};
const types = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".m4a": "audio/mp4", ".json": "application/json",
};

const siteHeaders = require("../vercel.json").headers.flatMap((rule) => rule.headers)
  .map(({ key, value }) => [key, key === "Content-Security-Policy" ? value.replace("connect-src 'self'", "connect-src 'self' ws://127.0.0.1:7880 http://127.0.0.1:7880") : value]);
const port = Number(process.env.PORT) || 3017;
const allowedHosts = new Set([`127.0.0.1:${port}`, `localhost:${port}`]);

http.createServer((req, res) => {
  let pathname;
  let file;
  try {
    if (!allowedHosts.has(req.headers.host)) throw new Error("host");
    pathname = new URL(req.url, "http://localhost").pathname;
    file = path.join(root, decodeURIComponent(pathname === "/" ? "/index.html" : pathname));
  } catch {
    res.statusCode = 400;
    return res.end();
  }
  siteHeaders.forEach(([key, value]) => res.setHeader(key, value));
  if (routes[pathname]) return routes[pathname](req, res);
  if (!file.startsWith(root + path.sep)) {
    res.statusCode = 403;
    return res.end();
  }
  fs.readFile(file, (error, data) => {
    if (error) {
      res.statusCode = 404;
      return res.end("Not found");
    }
    res.setHeader("Content-Type", types[path.extname(file)] || "application/octet-stream");
    res.setHeader("Cache-Control", "no-store");
    res.end(data);
  });
}).listen(port, "127.0.0.1", () => {
  console.log(`BOND preview on http://127.0.0.1:${port}`);
});
