import "./index.css";

import * as React from "react";
import * as ReactDom from "react-dom";

import retryLazy from "@fatso83/retry-dynamic-import/react-lazy";

(async () => {
  const MyModule = await retryLazy(() => import("./my-module"));

  const root = document.getElementById("root") as HTMLElement;
  ReactDom.render(<MyModule />, root);
})();
