"use strict";

const { cleanName, handle, hostCodeMatches, hostEnabled, newIdentity, send, sign } = require("./_lib/live");

module.exports = (req, res) => handle(req, res, async (body, settings) => {
  const wantsHost = body.role === "host";
  if (wantsHost && !hostEnabled()) return send(res, 403, { error: "Representative controls aren't set up on this deployment." });
  if (wantsHost && !hostCodeMatches(body.hostCode)) return send(res, 403, { error: "That host code didn't match." });
  const role = wantsHost ? "host" : "guest";
  const identity = newIdentity(role);
  const name = cleanName(body.name, wantsHost ? "Representative" : "Guest", role);
  const token = sign({
    sub: identity,
    name,
    video: {
      room: body.room,
      roomJoin: true,
      canSubscribe: true,
      canPublish: wantsHost,
      canPublishData: wantsHost,
      canPublishSources: ["microphone"],
      canUpdateOwnMetadata: false,
    },
  }, settings);
  return send(res, 200, { url: settings.url, token, identity, name, room: body.room, role, hostEnabled: hostEnabled() });
});
