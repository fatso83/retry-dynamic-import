import React from "react";
import lazyImportWithRetry from '../../../lib/react-lazy'

export const LazyReact = lazyImportWithRetry

export const LazyReactNaiveRetry: typeof React.lazy = (importer) => {
  const retryImport = async () => {
    try {
      return await importer();
    } catch (error) {
      // retry 5 times with 1 second delay
      for (let i = 0; i < 5; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** i));
        try {
          return await importer();
        } catch (e) {
          console.log("retrying import");
        }
      }
      throw error;
    }
  };
  return React.lazy(retryImport);
};

export const Loading = () => <div>Loading...</div>;
