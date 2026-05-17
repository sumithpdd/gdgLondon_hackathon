#!/usr/bin/env node
/**
 * Prints Vercel env hints from devfestlondon.json (does not print the private key).
 * Run: node scripts/print-vercel-admin-env.mjs
 */
import fs from "fs";
import path from "path";

const jsonPath = path.join(process.cwd(), "devfestlondon.json");
if (!fs.existsSync(jsonPath)) {
  console.error("Missing devfestlondon.json in project root.");
  process.exit(1);
}
const sa = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
const keyLen = sa.private_key?.length ?? 0;

console.log("\n=== Vercel environment variables ===\n");
console.log("FIREBASE_ADMIN_PROJECT_ID");
console.log(sa.project_id);
console.log("\nFIREBASE_ADMIN_CLIENT_EMAIL");
console.log(sa.client_email);
console.log("\nFIREBASE_ADMIN_PRIVATE_KEY");
console.log(`(paste the entire private_key from devfestlondon.json — ${keyLen} chars, must include BEGIN/END and \\n escapes)`);
console.log("\nIn Vercel: paste as ONE line in quotes, same as JSON private_key value.");
console.log("After saving env vars, redeploy Production (not just rebuild).\n");

if (keyLen < 400) {
  console.warn("WARNING: private_key in JSON looks too short.");
}
if (sa.private_key?.includes("...")) {
  console.warn("WARNING: private_key contains '...' — use the full key.");
}
