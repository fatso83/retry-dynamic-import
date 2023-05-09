type PositiveInteger<T extends number> = `${T}` extends
  | "0"
  | `-${any}`
  | `${any}.${any}`
  ? never
  : T;

const noop = () => {};
const defaultOpts = {
  importFunction: (path: string) => import(path),
  logger: (...args: any[]) => console.debug(...args),
};

/**
 * Exposed for testing
 *
 * Future improvements:
 * - improved cross browser support (add more strings to match for or trim away everything except a filename regex)
 * - cache successful variations to skip unnecessary lag on subsequent reloads
 */
export default function createDynamicImportWithRetry<T extends number>(
  maxRetries: PositiveInteger<T>,
  opts: Partial<{
    importFunction: () => Promise<any>;
    logger: (...args: any[]) => void;
  }> = {}
) {
  const resolvedOpts = {
    ...defaultOpts,
    ...opts,
  };
  const { logger, importFunction } = resolvedOpts;

  return async (importer: () => Promise<any>) => {
    try {
      return await importer();
    } catch (error: any) {
      logger(Date.now(), `Importing failed`)

      // retry x times with 2 second delay base and backoff factor of 2 (2, 4, 8, 16, 32 seconds)
      for (let i = -1; i < maxRetries; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** i));

        // this assumes that the exception will contain this specific text with the url of the module
        // if not, the url will not be able to parse and we'll get an error on that
        // eg. "Failed to fetch dynamically imported module: https://example.com/assets/Home.tsx"
        const url = new URL(
          error.message
            .replace("Failed to fetch dynamically imported module: ", "")
            .trim()
        );
        // add a timestamp to the url to force a reload the module (and not use the cached version - cache busting)
        url.searchParams.set("t", `${+new Date()}`);
        logger(Date.now(), `Trying importing using module url set to ${url}`)

        try {
          return await importFunction(url.href);
        } catch (e) {
          logger(`Retrying import for ${url.href}`);
        }
      }
      throw error;
    }
  };
}
