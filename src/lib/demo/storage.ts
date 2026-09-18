"use client";

import { Timestamp } from "firebase/firestore";

import type { ApplicationAttachment } from "@/types";
import { nextId, update } from "./store";

const MAX_FILE_SIZE = 15 * 1024 * 1024;

export async function uploadAttachment(
  _userId: string,
  applicationId: string,
  file: File,
): Promise<ApplicationAttachment> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Die Datei ist zu groß (maximal 15 MB).");
  }

  const id = nextId("att");
  const url =
    typeof URL !== "undefined" && typeof URL.createObjectURL === "function"
      ? URL.createObjectURL(file)
      : "";

  const attachment: ApplicationAttachment = {
    id,
    name: file.name,
    path: `demo/${applicationId}/${id}-${file.name}`,
    url,
    size: file.size,
    contentType: file.type || "application/octet-stream",
    uploadedAt: Timestamp.now(),
  };

  update((draft) => {
    draft.applications = draft.applications.map((application) =>
      application.id === applicationId
        ? {
            ...application,
            attachments: [...application.attachments, attachment],
            updatedAt: Timestamp.now(),
          }
        : application,
    );
  });

  return attachment;
}

export async function deleteAttachment(
  applicationId: string,
  attachment: ApplicationAttachment,
): Promise<void> {
  update((draft) => {
    draft.applications = draft.applications.map((application) =>
      application.id === applicationId
        ? {
            ...application,
            attachments: application.attachments.filter(
              (entry) => entry.id !== attachment.id,
            ),
            updatedAt: Timestamp.now(),
          }
        : application,
    );
  });

  if (
    attachment.url.startsWith("blob:") &&
    typeof URL !== "undefined" &&
    typeof URL.revokeObjectURL === "function"
  ) {
    URL.revokeObjectURL(attachment.url);
  }
}
