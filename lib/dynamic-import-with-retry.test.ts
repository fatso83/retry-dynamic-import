import createDynamicImportWithRetry, {
  _parseModuleUrlFromImporterBody as parseBody,
} from "./dynamic-import-with-retry";

import debug from 'debug'

const logger = debug('dynamic-import:test')

// Not able to get this working for some reason? It cannot find the export
//import type {StrategyName} from  "./dynamic-import-with-retry";

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

  it("should work", () => {
    expect(parseBody(importer1)).toEqual("./some-module1");
    expect(parseBody(importer2)).toEqual("some-module2");
    expect(parseBody(importer3)).toEqual("../some-module3");
  });
});

describe("createDynamicImportWithRetry bust the cache of a module using the current time", () => {
  const path = "./foo-a123.js";

  const testRetryImportUsingStrategy = async (strategy: string, expectedPrefix:string) => {
    const body = `
      throw new TypeError("Failed to fetch dynamically imported module: https://localhost:1234/assets/${path.slice(2)}");

      // required to parse the path
      return import("${path}");`;

    const originalImport = new Function(body);

    const clock = jest.useFakeTimers({ now: 1000, doNotFake: [] });
    const importStub = jest.fn();
    importStub.mockResolvedValueOnce("export default () => <div>42</div>");

    const dynamicImportWithRetry = createDynamicImportWithRetry(1, {
      importFunction: importStub,
        strategy: strategy as any,
        logger
    });

    const /* ignored */ _promise = dynamicImportWithRetry(originalImport as any);
    await clock.advanceTimersByTimeAsync(1000);

    expect(importStub).toHaveBeenCalledTimes(1);
    expect(importStub).toBeCalledWith(
      `${expectedPrefix}/foo-a123.js?t=1500` /* 1000 + 2^-1*/
    );
  }

    test('it works using parsing of module name in importer body', () => testRetryImportUsingStrategy('PARSE_IMPORTER_FUNCTION_BODY' as const, '.'))
    test('it works using parsing of Chromium error messages', () => testRetryImportUsingStrategy('PARSE_ERROR_MESSAGE' as const, 'https://localhost:1234/assets'))
});
