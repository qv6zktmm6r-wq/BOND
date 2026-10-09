(() => {
  "use strict";

  const SDK_SRC = "vendor/livekit-client-2.22.3.umd.js";
  const CAPTION_TOPIC = "caption";
  const MAX_CAPTION = 300;
  let sdkPromise = null;

  function loadSdk() {
    if (window.LivekitClient) return Promise.resolve(window.LivekitClient);
    if (!sdkPromise) {
      sdkPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = SDK_SRC;
        script.async = true;
        script.onload = () => (window.LivekitClient ? resolve(window.LivekitClient) : reject(new Error("sdk")));
        script.onerror = () => {
          sdkPromise = null;
          reject(new Error("sdk"));
        };
        document.head.append(script);
      });
    }
    return sdkPromise;
  }

  async function post(path, body) {
    let response;
    try {
      response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    } catch {
      throw Object.assign(new Error("Can't reach the live-audio service."), { unavailable: true });
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw Object.assign(new Error(data.error || "Live audio isn't available right now."), {
        status: response.status,
        unavailable: response.status === 404 || response.status === 405 || response.status === 503,
      });
    }
    return data;
  }

  function roomFor(profileId) {
    return `bond-${String(profileId).toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 40)}`;
  }

  function roleOf(identity) {
    return String(identity).startsWith("host-") ? "host" : "guest";
  }

  async function join({ profileId, name, role, hostCode, onChange }) {
    const grant = await post("/api/live-token", { room: roomFor(profileId), name, role, hostCode });
    let LK;
    try {
      LK = await loadSdk();
    } catch {
      throw Object.assign(new Error("The live-audio player didn't load."), { unavailable: true });
    }
    const room = new LK.Room({ adaptiveStream: false, dynacast: false });
    const sink = document.createElement("div");
    sink.hidden = true;
    document.body.append(sink);
    const captions = new Map();
    let micTrack = null;
    let lastCaptionSent = 0;
    let pendingCaption = "";
    let captionTimer = 0;
    let closed = false;

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    function micOn(participant) {
      const publication = participant.getTrackPublication(LK.Track.Source.Microphone);
      return Boolean(publication && publication.track && !publication.isMuted);
    }

    function snapshot() {
      const local = room.localParticipant;
      const people = [...room.remoteParticipants.values()].map((participant) => {
        const canSpeak = Boolean(participant.permissions?.canPublish);
        const raised = participant.attributes?.hand === "raised";
        return {
          identity: participant.identity,
          name: participant.name || "Guest",
          role: roleOf(participant.identity),
          hand: canSpeak ? "mic" : raised ? "raised" : "",
          live: micOn(participant),
          caption: captions.get(participant.identity) || "",
        };
      });
      return {
        connected: room.state === LK.ConnectionState.Connected,
        identity: local.identity,
        role: grant.role,
        canPublish: Boolean(local.permissions?.canPublish),
        hand: local.attributes?.hand === "raised" ? "raised" : "",
        hostEnabled: Boolean(grant.hostEnabled),
        people,
        listeners: people.length + 1,
        hostPresent: grant.role === "host" || people.some((person) => person.role === "host"),
        speakers: people.filter((person) => person.live),
      };
    }

    const emit = () => { if (!closed) onChange?.(snapshot()); };

    room
      .on(LK.RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === LK.Track.Kind.Audio) sink.append(track.attach());
        emit();
      })
      .on(LK.RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
        track.detach();
        sink.querySelectorAll("audio").forEach((node) => { if (!node.srcObject) node.remove(); });
        captions.delete(participant.identity);
        emit();
      })
      .on(LK.RoomEvent.DataReceived, (payload, participant, kind, topic) => {
        if (topic !== CAPTION_TOPIC || !participant) return;
        if (!(participant.permissions?.canPublish || roleOf(participant.identity) === "host")) return;
        captions.set(participant.identity, decoder.decode(payload).slice(0, MAX_CAPTION));
        emit();
      })
      .on(LK.RoomEvent.ParticipantPermissionsChanged, emit)
      .on(LK.RoomEvent.ParticipantAttributesChanged, emit)
      .on(LK.RoomEvent.ParticipantConnected, emit)
      .on(LK.RoomEvent.ParticipantDisconnected, (participant) => {
        captions.delete(participant.identity);
        emit();
      })
      .on(LK.RoomEvent.TrackPublished, emit)
      .on(LK.RoomEvent.TrackUnpublished, emit)
      .on(LK.RoomEvent.TrackMuted, emit)
      .on(LK.RoomEvent.TrackUnmuted, emit)
      .on(LK.RoomEvent.Disconnected, () => {
        sink.remove();
        emit();
      });

    await room.connect(grant.url, grant.token, { autoSubscribe: true });
    await room.startAudio().catch(() => {});

    function flushCaption() {
      captionTimer = 0;
      if (!micTrack || !pendingCaption) return;
      lastCaptionSent = performance.now();
      room.localParticipant.publishData(encoder.encode(pendingCaption.slice(-MAX_CAPTION)), { reliable: true, topic: CAPTION_TOPIC }).catch(() => {});
    }

    const session = {
      identity: grant.identity,
      role: grant.role,
      snapshot,
      setHand: (value) => post("/api/live-mic", { room: grant.room, identity: grant.identity, action: value === "raised" ? "raise" : "lower", token: grant.token }).catch(() => {}),
      async publishMic(stream) {
        const [track] = stream.getAudioTracks();
        if (!track) return false;
        try {
          await room.localParticipant.publishTrack(track, { source: LK.Track.Source.Microphone, name: "microphone", dtx: true, red: true });
          micTrack = track;
          emit();
          return true;
        } catch {
          return false;
        }
      },
      async unpublishMic() {
        if (!micTrack) return;
        const track = micTrack;
        micTrack = null;
        pendingCaption = "";
        clearTimeout(captionTimer);
        await room.localParticipant.unpublishTrack(track, false).catch(() => {});
        emit();
      },
      sendCaption(text) {
        pendingCaption = String(text || "");
        if (captionTimer) return;
        captionTimer = setTimeout(flushCaption, Math.max(0, 250 - (performance.now() - lastCaptionSent)));
      },
      release: () => post("/api/live-mic", { room: grant.room, identity: grant.identity, action: "release", token: grant.token }).catch(() => {}),
      grant: (identity, code) => post("/api/live-mic", { room: grant.room, identity, action: "grant", hostCode: code }),
      revoke: (identity, code) => post("/api/live-mic", { room: grant.room, identity, action: "revoke", hostCode: code }),
      async leave() {
        if (closed) return;
        closed = true;
        clearTimeout(captionTimer);
        await room.disconnect().catch(() => {});
        sink.remove();
      },
    };
    emit();
    return session;
  }

  window.BondLive = { join, roomFor };
})();
