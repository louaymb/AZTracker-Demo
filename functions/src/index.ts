import { setGlobalOptions } from "firebase-functions/v2";

import "./lib/admin";

setGlobalOptions({ region: "us-central1", maxInstances: 10 });

export { gmailAuthUrl, gmailOAuthCallback } from "./functions/gmail-auth";
export { syncGmail, syncGmailScheduled } from "./functions/sync";
export { disconnectGmail } from "./functions/disconnect";
export {
  researchApplication,
  enrichApplicationsScheduled,
  onApplicationCreated,
} from "./functions/research";
export { generateReplyDraft, sendReply } from "./functions/reply";
export { generateInterviewPrep } from "./functions/interview";
