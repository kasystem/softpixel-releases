"use strict";
// Signs a release manifest with an Ed25519 private key, using the exact same
// canonical-JSON serialization the two Electron updaters verify against
// (pos-desktop/electron/updater/ui-updater.js and exe-updater.js). Any drift
// between this and those two functions would make every manifest this script
// produces silently fail to verify on-device, so this is a byte-for-byte
// copy, not a reimplementation.
//
// Usage:
//   node scripts/sign-manifest.js <manifest.json> <signatureField> <privateKeyPemEnvVar>
//
// Reads the manifest JSON (must NOT already contain the signature field),
// signs canonicalize(manifest) with the Ed25519 private key PEM held in the
// named environment variable, and prints the manifest with the signature
// field added, to stdout.
const fs = require("fs");
const crypto = require("crypto");

function canonicalize(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(value[k])}`).join(",")}}`;
}

function main() {
  const [manifestPath, sigField, keyEnvVar] = process.argv.slice(2);
  if (!manifestPath || !sigField || !keyEnvVar) {
    console.error("Usage: node sign-manifest.js <manifest.json> <signatureField> <privateKeyPemEnvVar>");
    process.exit(1);
  }
  const privateKeyPem = process.env[keyEnvVar];
  if (!privateKeyPem) {
    console.error(`Environment variable ${keyEnvVar} is not set — refusing to sign.`);
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (manifest[sigField] !== undefined) {
    console.error(`Manifest already contains a "${sigField}" field — refusing to sign a pre-signed manifest.`);
    process.exit(1);
  }
  const data = Buffer.from(canonicalize(manifest), "utf8");
  const signature = crypto.sign(null, data, privateKeyPem); // Ed25519 — algorithm must be null
  manifest[sigField] = signature.toString("base64");
  process.stdout.write(JSON.stringify(manifest, null, 2));
}

main();
