/** Barrel export for the Firebase configuration layer. */
export { app, auth, db, rtdb, storage } from "./firebase";
export { firebaseConfig } from "./firebase.config";
export { COLLECTIONS, SUBCOLLECTIONS } from "./collections";
export type { CollectionName } from "./collections";
export { RTDB_PATHS } from "./rtdb-paths";
