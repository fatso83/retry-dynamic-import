import _createDynamicImportWithRetry from "./retry.js";

const defaultDynamicImportWithRetry = _createDynamicImportWithRetry(5);

export const dynamicImportWithRetry = defaultDynamicImportWithRetry;
export const createDynamicImportWithRetry = _createDynamicImportWithRetry;
