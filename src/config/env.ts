/**
 * Typed, validated access to environment variables.
 *
 * The rest of the app reads configuration through `env` rather than touching
 * `import.meta.env` directly. This gives us one place to validate that every
 * required variable is present and to fail loudly when a feature is used
 * without its configuration.
 *
 * Validation is LAZY: a key is only checked when the code that needs it reads
 * it (via a getter). This lets the app boot with, say, Firebase configured but
 * Cloudinary not yet set up — the Cloudinary error only surfaces when an upload
 * is attempted, not at startup. Firebase keys are read during auth init, so a
 * missing Firebase value still fails early and clearly.
 *
 * Firebase web keys are public identifiers by design — real protection comes
 * from the Firestore/RTDB/Storage security rules, not from hiding these values.
 */

function required(key: keyof ImportMetaEnv): string {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(
      `[env] Missing required environment variable: ${String(key)}. ` +
        `Copy .env.example to .env.local and fill in the value.`
    );
  }
  return value;
}

export const env = {
  firebase: {
    get apiKey() {
      return required("VITE_FIREBASE_API_KEY");
    },
    get authDomain() {
      return required("VITE_FIREBASE_AUTH_DOMAIN");
    },
    get projectId() {
      return required("VITE_FIREBASE_PROJECT_ID");
    },
    get storageBucket() {
      return required("VITE_FIREBASE_STORAGE_BUCKET");
    },
    get messagingSenderId() {
      return required("VITE_FIREBASE_MESSAGING_SENDER_ID");
    },
    get appId() {
      return required("VITE_FIREBASE_APP_ID");
    },
    get databaseURL() {
      return required("VITE_FIREBASE_DATABASE_URL");
    },
  },
  cloudinary: {
    get cloudName() {
      return required("VITE_CLOUDINARY_CLOUD_NAME");
    },
    get uploadPreset() {
      return required("VITE_CLOUDINARY_UPLOAD_PRESET");
    },
  },
  /** True during local development / `vite dev`. */
  isDev: import.meta.env.DEV,
  /** True in production builds. */
  isProd: import.meta.env.PROD,
} as const;
