import React from "react";
import createDynamicImportWithRetry from "./retry";

const defaultDynamicImportWithRetry = createDynamicImportWithRetry(5);
/**
 * This works around the fact that module resolutions are cached per spec. Which means that if a module should
 * fail to import by some random network error _once_, it will keep on failing for the remainder of the session.
 * In the case of Chromium (and derivatives) it is even worse, as it will be sticky across browser-restarts, forcing
 * you to manually clear all caches to get it to work again.
 *
 * Note to the future developer that sees a potential improvement in inlining the `importer` bit and just pass the path:
 * this will not work, as Vite (or whatever bundler/transpiler/thingie we are using) will then fail to automatically
 * map module file names.
 * `import('MyModule'))` will usually resolve to `/assets/MyModule-523a2f.js`, but would then just resolve to
 * `/assets/MyModule.js` if you were to inline the `importer` bit! So don't do it :)
 *
 * @param importer
 */
function lazyImportWithRetry(importer: () => Promise<any>) {
  return React.lazy(() => defaultDynamicImportWithRetry(importer));
}
export default lazyImportWithRetry;
