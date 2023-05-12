import { LazyReact, Loading } from "./components/LazyReact";
import React, { Suspense, useState } from "react";

const LazyConfetti = LazyReact(() => {
  return import("./components/ExpensiveComponent");
});

function App() {
  return (
    <div>
      <h2>Lazy React component with retries</h2>
      <p>Try <a href="https://stackoverflow.com/a/76200536/200987">blocking and then unblocking the requests for ExpensiveComponent</a></p>
      <h1>React App</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <LazyConfetti />
      </Suspense>
    </div>
  );
}

export default App;
