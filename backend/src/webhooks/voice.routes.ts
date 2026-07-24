import { Router } from "express";
import * as voiceWebhook from "./voice.js";

const router = Router();

// Main incoming call handler
router.post("/incoming", voiceWebhook.handleIncomingCall);

// Dial status callback from <Dial> — fires on answer/no-answer/busy/failed
router.post("/dial-status", voiceWebhook.handleDialStatus);

// Legacy no-answer handler (alias to dial-status)
router.post("/no-answer", voiceWebhook.handleNoAnswer);

// Voicemail recording callback from <Record>
router.post("/voicemail", voiceWebhook.handleVoicemailRecording);

// Voicemail transcription callback (async from Twilio)
router.post("/transcription", voiceWebhook.handleTranscription);

// Call status callback (overall call lifecycle)
router.post("/status", voiceWebhook.handleStatusCallback);

export default router;
