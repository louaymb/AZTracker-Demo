"use client";

import { arrayRemove, arrayUnion, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { APPLICATIONS_COLLECTION } from "@/lib/constants";
import type { ApplicationAttachment } from "@/types";
import { db, storage } from "./client";

const MAX_FILE_SIZE = 15 * 1024 * 1024;

function sanitizeFileName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "_")
    .slice(-120);
}

export async function uploadAttachment(
  userId: string,
  applicationId: string,
  file: File,
): Promise<ApplicationAttachment> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Die Datei ist zu groß (maximal 15 MB).");
  }

  const id = crypto.randomUUID();
  const path = `users/${userId}/attachments/${applicationId}/${id}-${sanitizeFileName(file.name)}`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, file, {
    contentType: file.type || "application/octet-stream",
  });
  const url = await getDownloadURL(storageRef);

  const attachment: ApplicationAttachment = {
    id,
    name: file.name,
    path,
    url,
    size: file.size,
    contentType: file.type || "application/octet-stream",
    uploadedAt: null,
  };

  await updateDoc(doc(db, APPLICATIONS_COLLECTION, applicationId), {
    attachments: arrayUnion({ ...attachment, uploadedAt: serverTimestamp() }),
    updatedAt: serverTimestamp(),
  });

  return attachment;
}

export async function deleteAttachment(
  applicationId: string,
  attachment: ApplicationAttachment,
): Promise<void> {
  try {
    await deleteObject(ref(storage, attachment.path));
  } catch {
    // File might already be gone – still remove the metadata.
  }
  await updateDoc(doc(db, APPLICATIONS_COLLECTION, applicationId), {
    attachments: arrayRemove(attachment),
    updatedAt: serverTimestamp(),
  });
}
