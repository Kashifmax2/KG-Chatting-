/**
 * Firebase configuration object.
 *
 * Values are sourced from validated environment variables (see `@/config/env`),
 * never hardcoded. This module only shapes the config — initialization happens
 * once in `firebase.ts`.
 */
import type { FirebaseOptions } from "firebase/app";
import { env } from "@/config/env";

export const firebaseConfig: FirebaseOptions = {
  apiKey: env.firebase.apiKey,
  authDomain: env.firebase.authDomain,
  projectId: env.firebase.projectId,
  storageBucket: env.firebase.storageBucket,
  messagingSenderId: env.firebase.messagingSenderId,
  appId: env.firebase.appId,
  databaseURL: env.firebase.databaseURL,
};
