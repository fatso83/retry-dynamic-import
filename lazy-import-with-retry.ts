import React from 'react'

type PositiveInteger<T extends number> =
  `${T}` extends '0' | `-${any}` | `${any}.${any}` ? never : T

const noop = () => {}
const defaultOpts = { 
      importFunction : (path: string) => import(path),
      logger : (...args: any[]) => console.debug(...args)
  }

/**
 * Exposed for testing
 *
 * Future improvements:
 * - improved cross browser support (add more strings to match for or trim away everything except a filename regex)
 * - cache successful variations to skip unnecessary lag on subsequent reloads
 */
export function createDynamicImportWithRetry<T extends number>(
  maxRetries: PositiveInteger<T>,
  opts : Partial<{importFunction: () => Promise<any>, logger: (...args: any[]) => void}> = {}
) {
    const resolvedOpts = {
        ...defaultOpts,
        ...opts,
    }
  return async (importer: () => Promise<any>) => {
    try {
      return await importer()
    } catch (error: any) {
      // retry x times with 2 second delay base and backoff factor of 2 (2, 4, 8, 16, 32 seconds)
      for (let i = -1; i < maxRetries; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** i))
        // this assumes that the exception will contain this specific text with the url of the module
        // if not, the url will not be able to parse and we'll get an error on that
        // eg. "Failed to fetch dynamically imported module: https://example.com/assets/Home.tsx"
        const url = new URL(error.message.replace('Failed to fetch dynamically imported module: ', '').trim())
        // add a timestamp to the url to force a reload the module (and not use the cached version - cache busting)
        url.searchParams.set('t', `${+new Date()}`)

        try {
          return await resolvedOpts.importFunction(url.href)
        } catch (e) {
          resolvedOpts.logger(`Retrying import for ${url.href}`)
        }
      }
      throw error
    }
  }
}

const defaultDynamicImportWithRetry = createDynamicImportWithRetry(5)
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
  return React.lazy(() => defaultDynamicImportWithRetry(importer))
}
export default lazyImportWithRetry
