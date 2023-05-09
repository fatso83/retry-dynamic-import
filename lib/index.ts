import _createDynamicImportWithRetry from "./dynamic-import-with-retry";
import _reactLazy from './react-lazy'

const defaultDynamicImportWithRetry = _createDynamicImportWithRetry(5);

export const dynamicImportWithRetry = defaultDynamicImportWithRetry
export const createDynamicImportWithRetry = _createDynamicImportWithRetry;
export const reactLazyWithRetry = _reactLazy;
