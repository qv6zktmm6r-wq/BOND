"use strict";

const { IDENTITY_PATTERN, handle, hostCodeMatches, roomService, send, verify } = require("./_lib/live");

const SELF_ACTIONS = ["raise", "lower", "release"];
const HOST_ACTIONS = ["grant", "revoke"];

module.exports = (req, res) => handle(req, res, async (body, settings) => {
  const { room, identity, action } = body;
  if (!IDENTITY_PATTERN.test(String(identity || "")) || !String(identity).startsWith("guest-")) return send(res, 400, { error: "Unknown participant." });
  if (![...SELF_ACTIONS, ...HOST_ACTIONS].includes(action)) return send(res, 400, { error: "Unknown action." });
  if (SELF_ACTIONS.includes(action)) {
    const claims = verify(body.token, settings);
    if (!claims || claims.sub !== identity || claims.video?.room !== room) return send(res, 403, { error: "You can only change your own hand or mic." });
  } else if (!hostCodeMatches(body.hostCode)) {
    return send(res, 403, { error: "That host code didn't match." });
  }
  const update = { room, identity };
  if (action === "raise" || action === "lower") {
    update.attributes = { hand: action === "raise" ? "raised" : "" };
  } else {
    const speaking = action === "grant";
    update.permission = {
      canSubscribe: true,
      canPublish: speaking,
      canPublishData: speaking,
      canPublishSources: ["MICROPHONE"],
      canUpdateMetadata: false,
    };
    update.attributes = { hand: speaking ? "mic" : "" };
  }
  const ok = await roomService("UpdateParticipant", update, settings);
  if (!ok) return send(res, 404, { error: "That participant has left the room." });
  return send(res, 200, { ok: true, identity, action });
});
