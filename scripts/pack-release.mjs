import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { verifyPackage } from "./verify-package.mjs";

const root = resolve(import.meta.dirname, "..");
const destination = resolve(process.argv[2] ?? resolve(root, "pkg"));
mkdirSync(destination, { recursive: true });
const [packed] = JSON.parse(
  execFileSync(
    "npm",
    ["pack", "./pkg", "--json", "--pack-destination", destination],
    { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
  ),
);
const archive = resolve(destination, packed.filename);
await verifyPackage(archive);
// The publish script consumes only this path; validation diagnostics go to stderr.
console.log(archive);
