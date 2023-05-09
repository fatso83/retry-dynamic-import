import React from "react";

export const LazyReact: typeof React.lazy = (importer) => {
  const retryImport = async () => {
    try {
      return await importer();
    } catch (error: any) {
      // retry 5 times with 1 second delay and backoff factor of 2 (2, 4, 8, 16, 32 seconds)
      for (let i = 0; i < 5; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** i));
        // this assumes that the error message that the browser exception will contain this specific text.
        // if not, the url will not be able to parse and we'll get an error on that
        const url = new URL(
          error.message
            .replace("Failed to fetch dynamically imported module: ", "")
            .trim()
        );
        // add a timestamp to the url to force a reload the module (and not use the cached version - cache busting)
        url.searchParams.set("t", `${+new Date()}`);

        try {
          return await import(url.href);
        } catch (e) {
          console.log("retrying import");
        }
      }
      throw error;
    }
  };
  return React.lazy(retryImport);
};

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
