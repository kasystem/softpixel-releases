# Release architecture

New EXE/APK/UI binaries belong in immutable GitHub Release assets or approved object storage, never ordinary Git history. Channel manifests are reviewed text pointers and must be signed over canonical JSON using an offline-controlled key exposed to Actions only as an encrypted secret. Promotion reuses identical hashes.

Initial workflows are deliberately guarded and do not build or publish until source-repository checkout permissions, signing identities, artifact retention and approval environments are configured.

## Phase 9 workflows (manual dispatch only, never auto-triggered)

- `.github/workflows/release-electron-exe.yml` — builds the real production Electron shell from `kasystem/pos-desktop`'s `pos-desktop/electron` (never the archived `softpixel-web-shell`) against a pinned `kasystem/pos-ui` ref, signs an EXE update manifest, uploads both as workflow artifacts, and optionally drafts (never auto-publishes) a GitHub Release. Requires `CROSS_REPO_CHECKOUT_TOKEN` (a PAT with read access to pos-desktop + pos-ui) and `PROGRAMERI_EXE_MANIFEST_SIGNING_KEY` (Ed25519 private key PEM, independent trust root from the UI key). Neither secret is configured yet — the guard job fails immediately until they are.
- `.github/workflows/release-ui-bundle.yml` — builds `pos-ui/dist`, zips it, signs a UI update manifest matching what `pos-desktop/electron/updater/ui-updater.js` verifies. Requires `PROGRAMERI_UI_MANIFEST_SIGNING_KEY`.
- `.github/workflows/release-android-apk.yml` — builds the Capacitor Android release APK and signs it with `apksigner` (the project's `android/app/build.gradle` has no gradle `signingConfig` block, so signing happens out-of-band here, matching how it's done outside CI today). Requires `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.

Every manifest these workflows produce is written with `rollout_percent: 0` and a placeholder `bundle_url`/`url` — a human must fill in the real asset URL after upload and re-sign (or run the release-drafting step first) before any device would actually install it. `draft_release` defaults to `false` in all three; even when `true`, the created GitHub Release is always `draft: true`, never published automatically. None of these three workflows has ever been executed — see `PHASE_9_ELECTRON_RELEASE_REPORT.md` in the main `POS-Lokal` repo for what is and isn't verified.

## UI key rotation

Create a new external key, assign a new key ID, first deploy a shell that accepts old and new IDs, publish newly encrypted/signed bundles with the new ID, wait through the compatibility window, remove the old key from the publisher, then revoke it. Never commit either key. Historic compromised material requires separate coordinated cleanup.
