import _createDynamicImportWithRetry from "./retry.ts";

const defaultDynamicImportWithRetry = _createDynamicImportWithRetry(5);

export const dynamicImportWithRetry = defaultDynamicImportWithRetry;
export const createDynamicImportWithRetry = _createDynamicImportWithRetry;
