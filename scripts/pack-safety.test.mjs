import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "..");
test("packing the source checkout is rejected instead of publishing missing entries", () => {
  const destination = mkdtempSync(resolve(tmpdir(), "retry-pack-safety-"));
  try {
    const result = spawnSync(
      "npm",
      [
        "pack",
        "--pack-destination",
        destination,
        "--cache",
        resolve(destination, "cache"),
      ],
      {
        cwd: root,
        encoding: "utf8",
      },
    );
    assert.notEqual(
      result.status,
      0,
      "npm pack must reject the source checkout",
    );
    assert.match(
      result.stderr + result.stdout,
      /npm run build.*npm pack.*pkg/s,
    );
  } finally {
    rmSync(destination, { recursive: true, force: true });
  }
});

test("archive validation rejects a tarball with missing advertised entries", async () => {
  const { verifyPackage } = await import("./verify-package.mjs");
  const destination = mkdtempSync(resolve(tmpdir(), "retry-bad-package-"));
  try {
    // Reproduce the malformed registry artifact by explicitly bypassing the guard.
    const result = spawnSync(
      "npm",
      [
        "pack",
        "--ignore-scripts",
        "--json",
        "--pack-destination",
        destination,
        "--cache",
        resolve(destination, "cache"),
      ],
      {
        cwd: root,
        encoding: "utf8",
      },
    );
    assert.equal(result.status, 0, result.stderr);
    const [packed] = JSON.parse(result.stdout);
    await assert.rejects(
      verifyPackage(resolve(destination, packed.filename)),
      /Missing advertised entry: \.\/index\.js/,
    );
  } finally {
    rmSync(destination, { recursive: true, force: true });
  }
});
