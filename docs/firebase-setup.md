# Firebase Setup

This project currently runs safely in JSON mode.

To enable Firebase later, create a Firebase project and add the following variables to Vercel:

```txt
VITE_DATA_SOURCE=firebase
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## Firestore collections

### projects

Each document should follow the `Project` type in:

```txt
src/types/project.ts
```

### project_updates

Each document should follow the `ProjectUpdate` type in:

```txt
src/types/project.ts
```

## Current status

Firebase client and service files are ready, but the app still uses JSON mode by default.

The next development step is to switch the admin dashboard from temporary local state to Firestore writes when `VITE_DATA_SOURCE=firebase`.
