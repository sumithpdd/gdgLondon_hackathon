#!/usr/bin/env node
/**
 * Verifies hackathon Cloud Functions stay in sync:
 * - exported from functions/src/index.ts
 * - listed in lib/cloud-functions.ts
 * - referenced by client httpsCallable(..., "name")
 */
import fs from "fs";
import path from "path";

import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function extractManifest() {
  const src = read("lib/cloud-functions.ts");
  const match = src.match(/HACKATHON_CALLABLES\s*=\s*\[([\s\S]*?)\]\s*as const/);
  if (!match) throw new Error("Could not parse HACKATHON_CALLABLES in lib/cloud-functions.ts");
  return [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

function extractExported() {
  const src = read("functions/src/index.ts");
  return [...src.matchAll(/export const (\w+)\s*=\s*onCall/g)].map((m) => m[1]);
}

function extractClientCallables() {
  const dirs = ["lib", "components", "app"];
  const names = new Set();
  for (const dir of dirs) {
    const base = path.join(root, dir);
    if (!fs.existsSync(base)) continue;
    walk(base, (file) => {
      if (!/\.(tsx?|jsx?)$/.test(file)) return;
      if (file.endsWith("cloud-functions.ts")) return;
      const text = fs.readFileSync(file, "utf8");
      const blocks = text.match(/httpsCallable[\s\S]{0,400}?\)/g) || [];
      for (const block of blocks) {
        const m = block.match(/functions\s*,\s*["'](\w+)["']/);
        if (m) names.add(m[1]);
      }
    });
  }
  return [...names].sort();
}

function walk(dir, fn) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, fn);
    else fn(p);
  }
}

function diff(label, a, b) {
  const onlyA = a.filter((x) => !b.includes(x));
  const onlyB = b.filter((x) => !a.includes(x));
  if (onlyA.length === 0 && onlyB.length === 0) return true;
  console.error(`\n${label} mismatch:`);
  if (onlyA.length) console.error(`  only in first: ${onlyA.join(", ")}`);
  if (onlyB.length) console.error(`  only in second: ${onlyB.join(", ")}`);
  return false;
}

const manifest = extractManifest();
const exported = extractExported();
const client = extractClientCallables();

console.log(`Manifest: ${manifest.length} | Exported: ${exported.length} | Client refs: ${client.length}`);

let ok = true;
ok = diff("manifest vs exported", manifest, exported) && ok;

const clientOnly = client.filter((x) => !manifest.includes(x));
if (clientOnly.length) {
  console.error(`\nclient calls unknown functions: ${clientOnly.join(", ")}`);
  ok = false;
}

const notInClient = manifest.filter((x) => !client.includes(x));
if (notInClient.length) {
  console.log(`\nNote: exported but not referenced in client scan (OK for admin-only): ${notInClient.join(", ")}`);
}

if (ok) {
  console.log("\nOK — hackathon callables are in sync.");
  process.exit(0);
}
console.error("\nFix lib/cloud-functions.ts, functions/src/index.ts, and client httpsCallable names.");
process.exit(1);
