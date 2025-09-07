type PositiveInteger<T extends number> = `${T}` extends
  | "0"
  | `-${any}`
  | `${any}.${any}`
  ? never
  : T;

const noop = () => {};

const identity = (e: any) => e;
const uriOrRelativePathRegex = /(['"])((\w+:(\/?\/?))?[^\s,]+)\1/;
function parseModulePathFromImporterBody(importer: () => any): string | null {
  const fnString = importer.toString();
  const match = fnString.match(uriOrRelativePathRegex);
  if (!match) return null;
  return match.filter(identity)[2];
}

export type UrlStrategy = (error: Error, importer: () => any) => string | null;
export type StrategyName =
  | "PARSE_ERROR_MESSAGE"
  | "PARSE_IMPORTER_FUNCTION_BODY";

const strategies: Record<StrategyName, UrlStrategy> = {
  /** This only works in Chromium browsers, as other engines (like Firefox) do not carry the module url in the error message */
  PARSE_ERROR_MESSAGE: (error: Error, _: () => any) => {
    // this assumes that the exception will contain this specific text with the url of the module
    // if not, the url will not be able to parse and we'll get an error on that
    // eg. "Failed to fetch dynamically imported module: https://example.com/assets/Home.tsx"
    const urlAsString = error.message
      .replace("Failed to fetch dynamically imported module: ", "")
      .trim();

    const url = new URL(urlAsString);
    return url.href;
  },
  /** Should work in most browsers */
  PARSE_IMPORTER_FUNCTION_BODY: (_: Error, importer: () => any) => {
    return parseModulePathFromImporterBody(importer);
  },
};
const getModulePath = (strategy: Opts['strategy'], error: Error, importer: () => any): string | null => {
  const strategyFn = typeof strategy === 'function'
    ? strategy
    : strategies[strategy];

  return strategyFn(error, importer);
}

/**
 * strategy - can be one of the pre-defined strategies or a custom one passed in as a function
 * importFunction - strictly meant for testing to easily override the default `import()` function
 */
export type Opts = {
  strategy: StrategyName | UrlStrategy,
  importFunction: (path: string) => Promise<any>;
  logger: (...args: any[]) => void;
}

const defaultOpts: Opts = {
  strategy: "PARSE_IMPORTER_FUNCTION_BODY" as const,
  importFunction: (path) => import(/* @vite-ignore */ path),
  logger: noop,
};

/**
 * @param {number} maxRetries - how many retries to allow. We employ exponential backoff
 * @param {Opts} opts - optional parameters, some just used for testing
 * @param opts.strategy - pass in a custom function or one of the pre-defined string constants
 * @param opts.importFunction - strictly meant for testing; stubbing out the default `import()`
 * @param opts.logger - override the logger with your own
 *
 * Future improvements:
 * - cache successful variations to skip unnecessary lag on subsequent reloads
 */
export default function createDynamicImportWithRetry<T extends number>(
  maxRetries: PositiveInteger<T>,
  opts: Partial<Opts> = {},
): <TImportReturn>(
  importer: () => Promise<TImportReturn>,
) => Promise<TImportReturn> {
  const resolvedOpts = {
    ...defaultOpts,
    ...opts,
  };
  const { logger, importFunction, strategy } = resolvedOpts;

  return async <TImportReturn>(
    importer: () => Promise<TImportReturn>,
  ): Promise<TImportReturn> => {
    try {
      return await importer();
    } catch (error: any) {
      logger(Date.now(), `Importing failed: `, error);

      const modulePath = getModulePath(strategy, error, importer);
      logger(`Parsed url using ${strategy}:${modulePath}`);

      if (!modulePath) {
        logger("Unable to determine path to module when trying to reload");
        // nothing we can do ...
        throw error;
      }

      // retry x times with 2 second delay base and backoff factor of 2 (1/2, 1, 2, 4, 8 seconds)
      for (let i = 0; i < maxRetries; i++) {
        // add a timestamp to the url to force a reload of the module (and not use the cached version - cache busting)
        let cacheBustedPath = `${modulePath}?t=${+new Date()}`;
        logger(
          Date.now(),
          `Trying re-import module using cache busted path: ${cacheBustedPath}`,
        );

        try {
          return await importFunction(cacheBustedPath);
        } catch (e) {
          logger(`Import for ${cacheBustedPath} failed`);
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * 2 ** (i - 1)),
          );
        }
      }
      throw error;
    }
  };
}

/** only exposed for testing */
export const _parseModuleUrlFromImporterBody = parseModulePathFromImporterBody;
export const _strategies = strategies;
