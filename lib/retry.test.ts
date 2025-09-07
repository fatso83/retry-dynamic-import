import createDynamicImportWithRetry, {
  _parseModuleUrlFromImporterBody as parseBody,
} from "./retry";
import type {
  Opts,
  UrlStrategy,
} from "./retry"

import debug from "debug";

const logger = debug("dynamic-import:test");


describe("path parsing of importer function", () => {
  // @ts-ignore
  const importer1 = () => import("./some-module1");
  const importer2 = () => {
    // @ts-ignore
    return import("some-module2");
  };
  const importer3 = function () {
    // some comment
    // @ts-ignore
    return import("../some-module3");
  };
  const importer4 = function () {
    // @ts-ignore
    return import('./some-module4')
  }
  const viteImporterWithPreloadedDeps = function () {};
  // Vite can wrap dynamic import functions into something like the following
  viteImporterWithPreloadedDeps.toString = function () {
    return `()=>H(()=>import("./NeedsFooAndBar.js"),["assets/foo.js","assets/bar.js"])`;
  };

  it("should work", () => {
    expect(parseBody(importer1)).toEqual("./some-module1");
    expect(parseBody(importer2)).toEqual("some-module2");
    expect(parseBody(importer3)).toEqual("../some-module3");
    expect(parseBody(importer4)).toEqual("./some-module4");
    expect(parseBody(viteImporterWithPreloadedDeps)).toEqual(
      "./NeedsFooAndBar.js",
    );
  });
});

describe("createDynamicImportWithRetry bust the cache of a module using the current time", () => {
  const path = "./foo-a123.js";
  const body = `
    throw new TypeError("Failed to fetch dynamically imported module: https://localhost:1234/assets/${path.slice(
      2,
    )}");

    // required to parse the path
    return import("${path}");`;

  const originalImport = new Function(body) as () => Promise<any> ;
  const testRetryImportUsingStrategy = async (
    strategy: Opts['strategy'],
    expectedPrefix: string,
    importer: () => Promise<any> = originalImport,
  ) => {
    const clock = jest.useFakeTimers({ now: 0, doNotFake: [] });
    const importStubUsedInRetries = jest.fn();
    importStubUsedInRetries
      .mockRejectedValueOnce(new Error("Failed loading for some reason"))
      .mockResolvedValueOnce("export default () => <div>42</div>");

    const dynamicImportWithRetry = createDynamicImportWithRetry(2, {
      importFunction: importStubUsedInRetries,
      strategy: strategy as any,
      logger,
    });

    dynamicImportWithRetry(importer).catch(logger);
    await clock.advanceTimersByTimeAsync(1000);

    expect(importStubUsedInRetries).toHaveBeenCalledTimes(2);

    // should fail
    expect(importStubUsedInRetries).toBeCalledWith(
      `${expectedPrefix}/foo-a123.js?t=0` /* 0 */,
    );

    // success call
    expect(importStubUsedInRetries).toBeCalledWith(
      `${expectedPrefix}/foo-a123.js?t=500` /* 0 + 2^-1*/,
    );
  };

  test("it works using parsing of module name in importer body", () =>
    testRetryImportUsingStrategy("PARSE_IMPORTER_FUNCTION_BODY" as const, "."));
  test("it works using parsing of Chromium error messages", () =>
    testRetryImportUsingStrategy(
      "PARSE_ERROR_MESSAGE" as const,
      "https://localhost:1234/assets",
    ));

  test("it works using custom strategy", ()=>  {
    const moduleSpecifierSymbol = Symbol();

    const useHintAssignedToImporter: UrlStrategy = (_, importer) =>
      moduleSpecifierSymbol in importer
        ? String(importer[moduleSpecifierSymbol])
        : null;

    const importer = Object.assign(() => import(path), {
      [moduleSpecifierSymbol]: path,
    });

    return testRetryImportUsingStrategy(useHintAssignedToImporter, ".", importer);
  });
});
