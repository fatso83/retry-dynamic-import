import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: {
        index: resolve(__dirname, "lib/index.ts"),
        ["react-lazy"]: resolve(__dirname, "lib/react-lazy.ts"),
      },
    },
    rollupOptions: {
      // externalize deps that shouldn't be bundled
      external: ["react"],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          vue: "Vue", // not actually present. Yet :)
          react: "React",
        },
      },
    },
  },
});
