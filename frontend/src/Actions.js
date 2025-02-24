const ACTIONS = {
  JOIN: "join",
  JOINED: "joined",
  DISCONNECTED: "disconnected",
  CODE_CHANGE: "code-change",
  SYNC_CODE: "sync-code",
  LEAVE: "leave",
  // Add new voice chat actions
  VOICE_OFFER: "voice-offer",
  VOICE_ANSWER: "voice-answer",
  ICE_CANDIDATE: "ice-candidate",
  START_VOICE_CHAT: "start-voice-chat",
  END_VOICE_CHAT: "end-voice-chat",
};

module.exports = ACTIONS;
