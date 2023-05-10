type PositiveInteger<T extends number> = `${T}` extends
  | "0"
  | `-${any}`
  | `${any}.${any}`
  ? never
  : T;

const noop = () => {};

const identity = (e: any) => e;
const uriOrRelativePathRegex = /"((\w+:(\/?\/?))?[^\s]+)"/;
/** only exposed for testing */
export function _parseModuleUrlFromImporterBody(
  importer: () => any
): string | null {
  const fnString = importer.toString();
  const match = fnString.match(uriOrRelativePathRegex);
  if (!match) return null;
  return match.filter(identity)[1];
}

type UrlStrategy = (error: Error, importer: () => any) => string | null;
export type StrategyName = "PARSE_ERROR_MESSAGE" | "PARSE_IMPORTER_FUNCTION_BODY";

const strategies: Record<StrategyName, UrlStrategy> = {
  /** This only works in Chromium browsers, as other engines (like Firefox) do not carry the module url in the error message */
  PARSE_ERROR_MESSAGE: (error: Error, _: () => any) => {
    // this assumes that the exception will contain this specific text with the url of the module
    // if not, the url will not be able to parse and we'll get an error on that
    // eg. "Failed to fetch dynamically imported module: https://example.com/assets/Home.tsx"
    return error.message
      .replace("Failed to fetch dynamically imported module: ", "")
      .trim();
  },
  /** Should work in most browsers, but is potentially fragile when it comes to assembling the url from a sub-folder */
  PARSE_IMPORTER_FUNCTION_BODY: (_: Error, importer: () => any) => {
    return `${location.origin}${_parseModuleUrlFromImporterBody(importer)}`;
  },
};

const defaultOpts = {
  strategy: "PARSE_IMPORTER_FUNCTION_BODY" as const,
  importFunction: (path: string) => import(path),
  logger: noop,
};
/**
 * Future improvements:
 * - cache successful variations to skip unnecessary lag on subsequent reloads
 */
export default function createDynamicImportWithRetry<T extends number>(
  maxRetries: PositiveInteger<T>,
  opts: Partial<{
    strategy: StrategyName;
    importFunction: () => Promise<any>;
    logger: (...args: any[]) => void;
  }> = {}
) {
  const resolvedOpts = {
    ...defaultOpts,
    ...opts,
  };
  const { logger, importFunction, strategy } = resolvedOpts;

  return async (importer: () => Promise<any>) => {
    try {
      return await importer();
    } catch (error: any) {
      logger(Date.now(), `Importing failed: `, error);

      const moduleUrl = strategies[strategy](error, importer);
      logger(`Parsed url using ${strategy}:${moduleUrl}`);

      if (!moduleUrl) {
        logger("Unable to determine path to module when trying to reload");
        // nothing we can do ...
        throw error;
      }

      // retry x times with 2 second delay base and backoff factor of 2 (2, 4, 8, 16, 32 seconds)
      for (let i = -1; i < maxRetries; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** i));

        const url = new URL(moduleUrl);
        // add a timestamp to the url to force a reload the module (and not use the cached version - cache busting)
        url.searchParams.set("t", `${+new Date()}`);
        logger(Date.now(), `Trying importing using module url set to ${url}`);

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
