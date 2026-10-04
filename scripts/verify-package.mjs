import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  readFileSync,
  existsSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "vite";

const root = resolve(import.meta.dirname, "..");

// Validate the archive itself, not pkg/ or a symlink to the source checkout.
export async function verifyPackage(archive) {
  const work = mkdtempSync(resolve(tmpdir(), "retry-package-consumer-"));
  try {
    execFileSync("tar", ["-xf", resolve(archive), "-C", work]);
    const unpacked = resolve(work, "package");
    const manifest = JSON.parse(
      readFileSync(resolve(unpacked, "package.json"), "utf8"),
    );
    for (const entry of [
      manifest.main,
      manifest.types,
      ...Object.values(manifest.exports),
    ]) {
      assert.equal(
        typeof entry,
        "string",
        "expected a runtime or declaration entry",
      );
      assert.ok(
        existsSync(resolve(unpacked, entry)),
        `Missing advertised entry: ${entry}`,
      );
    }
    assert.ok(
      existsSync(resolve(unpacked, "react-lazy.d.ts")),
      "Missing React declarations",
    );
    assert.ok(existsSync(resolve(unpacked, "LICENSE")), "Missing LICENSE");
    assert.equal(
      manifest.scripts,
      undefined,
      "Release must not contain source build/test hooks",
    );
    assert.equal(
      manifest.devDependencies,
      undefined,
      "Release must not contain development dependencies",
    );

    writeFileSync(
      resolve(work, "package.json"),
      JSON.stringify({ private: true, type: "module" }),
    );
    execFileSync(
      "npm",
      [
        "install",
        "--ignore-scripts",
        "--offline",
        "--install-links",
        "--omit=optional",
        "--no-audit",
        "--no-fund",
        "--package-lock=false",
        "--cache",
        resolve(work, "cache"),
        resolve(archive),
        ...["react", "@types/react", "csstype"].map((name) =>
          resolve(root, "node_modules", name),
        ),
      ],
      { cwd: work, stdio: "pipe" },
    );

    writeFileSync(
      resolve(work, "smoke.mjs"),
      `
      import assert from 'node:assert/strict';
      import { dynamicImportWithRetry, createDynamicImportWithRetry } from '@fatso83/retry-dynamic-import';
      import lazy from '@fatso83/retry-dynamic-import/react-lazy';
      assert.equal(await dynamicImportWithRetry(async () => 42), 42);
      assert.equal(typeof createDynamicImportWithRetry, 'function');
      assert.equal(typeof lazy, 'function');
    `,
    );
    execFileSync(process.execPath, ["smoke.mjs"], { cwd: work, stdio: "pipe" });

    writeFileSync(
      resolve(work, "consumer.ts"),
      `
      import { dynamicImportWithRetry, createDynamicImportWithRetry } from '@fatso83/retry-dynamic-import';
      import lazy from '@fatso83/retry-dynamic-import/react-lazy';
      const result: Promise<number> = dynamicImportWithRetry(async () => 42);
      const retried: Promise<number> = createDynamicImportWithRetry(1)(async () => 42);
      const component = lazy(async () => ({ default: () => null }));
      void [result, retried, component];
    `,
    );
    execFileSync(
      resolve(root, "node_modules/.bin/tsc"),
      [
        "--ignoreConfig",
        "--noEmit",
        "--strict",
        "--module",
        "nodenext",
        "--moduleResolution",
        "nodenext",
        "consumer.ts",
      ],
      { cwd: work, stdio: "pipe" },
    );

    // Exercise a real minified Vite/Rolldown consumer, including its emitted importer.
    writeFileSync(
      resolve(work, "consumer.mjs"),
      `
      import { createDynamicImportWithRetry } from '@fatso83/retry-dynamic-import';
      export const retryChunk = (importFunction) =>
        createDynamicImportWithRetry(1, { importFunction })(() => import('./chunk.mjs'));
    `,
    );
    writeFileSync(
      resolve(work, "chunk.mjs"),
      'throw new Error("initial import failed"); export const value = 0;',
    );
    await build({
      configFile: false,
      root: work,
      logLevel: "silent",
      build: {
        minify: true,
        rolldownOptions: {
          input: resolve(work, "consumer.mjs"),
          preserveEntrySignatures: "strict",
          output: { entryFileNames: "consumer.js" },
        },
      },
    });
    const built = resolve(work, "dist/consumer.js");
    assert.match(
      readFileSync(built, "utf8"),
      /import\(`/,
      "fixture must exercise Vite backtick output",
    );
    const { retryChunk } = await import(pathToFileURL(built).href);
    const paths = [];
    // Vite dispatches a browser preload-error event when the chunk throws.
    const previousWindow = globalThis.window;
    globalThis.window = new EventTarget();
    try {
      assert.deepEqual(
        await retryChunk(async (path) => {
          paths.push(path);
          return { value: 42 };
        }),
        { value: 42 },
      );
    } finally {
      if (previousWindow === undefined) delete globalThis.window;
      else globalThis.window = previousWindow;
    }
    assert.equal(paths.length, 1);
    assert.match(paths[0], /^\.\/(?:assets\/)?chunk-[^/]+\.js\?t=\d+$/);
    console.error(
      "Packed package: runtime imports, types and minified Vite retry passed.",
    );
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  assert.ok(
    process.argv[2],
    "Usage: node scripts/verify-package.mjs <archive.tgz>",
  );
  await verifyPackage(process.argv[2]);
}
