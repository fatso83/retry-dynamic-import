import createDynamicImportWithRetry from "./dynamic-import-with-retry";

function createChromeImportError(path: string) {
  return new Error(`Failed to fetch dynamically imported module: ${path}`);
}

function createFirefoxImportError(path: string) {
  return new Error(`TODO: something about 'dynamic loading failed: ${path}'`);
}

async function createNodeImportError(path: string) {
  let caught;
  try {
    // @ts-ignore
    await import("../../foo/bar/baz/random1234"); // => TypeError: Invalid URL
  } catch (err) {
    caught = err;
  }
  return caught;
}

const path = "https://foobar.com/assets/foo-a123.js";

async function testErrorHandling(networkError: Error) {
  const originalImport = jest.fn().mockRejectedValueOnce(networkError);

  // unsure how to use Jest's fake timers to control the time completely with promises ...
  const clock = jest.useFakeTimers({ now: 1000, doNotFake: [] });
  const importStub = jest.fn();
  importStub.mockResolvedValueOnce("export default () => <div>42</div>");

  const dynamicImportWithRetry = createDynamicImportWithRetry(1, {
    importFunction: importStub,
  });

  dynamicImportWithRetry(originalImport);
  await clock.advanceTimersByTimeAsync(1000);

  expect(originalImport).toHaveBeenCalledTimes(1);
  expect(importStub).toHaveBeenCalledTimes(1);
  expect(importStub).toBeCalledWith(
    "https://foobar.com/assets/foo-a123.js?t=1500" /* 1000 + 2^-1*/
  );
}

describe("createDynamicImportWithRetry bust the cache of a module using the current time", () => {
  test("chrome handling", async () =>
    testErrorHandling(createChromeImportError(path)));

  // TODO?:
  //test('firefox handling', async () => testErrorHandling(createFirefoxImportError(path)))
  //test('node handling', async () => testErrorHandling(await createNodeImportError(path)))
});
