import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions";

initializeApp();

export const db = getFirestore();
export { FieldValue, Timestamp, logger };
