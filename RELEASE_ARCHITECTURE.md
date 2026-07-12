# Release architecture

New EXE/APK/UI binaries belong in immutable GitHub Release assets or approved object storage, never ordinary Git history. Channel manifests are reviewed text pointers and must be signed over canonical JSON using an offline-controlled key exposed to Actions only as an encrypted secret. Promotion reuses identical hashes.

Initial workflows are deliberately guarded and do not build or publish until source-repository checkout permissions, signing identities, artifact retention and approval environments are configured.

## UI key rotation

Create a new external key, assign a new key ID, first deploy a shell that accepts old and new IDs, publish newly encrypted/signed bundles with the new ID, wait through the compatibility window, remove the old key from the publisher, then revoke it. Never commit either key. Historic compromised material requires separate coordinated cleanup.
