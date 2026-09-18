import { onCall } from "firebase-functions/v2/https";

import { revokeGmailCredentials } from "../lib/credentials";
import { assertOwner } from "../lib/owner";

export const disconnectGmail = onCall(
  { region: "us-central1", invoker: "public" },
  async (request) => {
    const uid = await assertOwner(request.auth?.uid);

    await revokeGmailCredentials(uid);

    return { ok: true as const };
  },
);
