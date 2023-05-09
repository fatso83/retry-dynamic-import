import React, { Suspense, useState } from "react";
import { LazyReact, Loading } from "./components/LazyReact";

const LazyConfetti = LazyReact(() => {
  return import("./components/ExpensiveComponent");
});

function App() {
  return (
    <div>
      <h2>Lazy React component with retries</h2>
      <h1>React App</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <LazyConfetti />
      </Suspense>
    </div>
  );
}

export default App;
