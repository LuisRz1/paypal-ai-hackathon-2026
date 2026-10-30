import { readFile } from "node:fs/promises";
import { verifyRecoveryPassport } from "../lib/evidence.ts";

const file = process.argv[2];
if (!file) {
  console.error("Usage: npx tsx web/scripts/verify-evidence.mjs <passport.json>");
  process.exit(2);
}

const passport = JSON.parse(await readFile(file, "utf8"));
const result = verifyRecoveryPassport(
  passport,
  process.env.RECOVER_PUBLIC_KEY_ID || undefined,
);
console.log(JSON.stringify(result, null, 2));
if (!result.valid) process.exit(1);
