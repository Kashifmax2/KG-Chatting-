/**
 * Firebase initialization — the single source of truth for Firebase instances.
 *
 * Firebase is initialized exactly once. Every service and store imports the
 * exported instances from here; nothing else calls `initializeApp`. Guarding on
 * `getApps()` keeps hot-module-reload in development from creating duplicate
 * apps.
 *
 * Never initialize Firebase inside React components.
 */
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getDatabase, type Database } from "firebase/database";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { firebaseConfig } from "./firebase.config";

/** The one Firebase app instance for the whole application. */
export const app: FirebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

/** Firebase Authentication. */
export const auth: Auth = getAuth(app);

/** Cloud Firestore — durable, queryable application data. */
export const db: Firestore = getFirestore(app);

/** Realtime Database — ephemeral realtime data only (presence, typing, etc.). */
export const rtdb: Database = getDatabase(app);

/** Firebase Storage — file blobs owned by the app. */
export const storage: FirebaseStorage = getStorage(app);
