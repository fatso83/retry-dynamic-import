import {
  LazyReact,
  LazyReactNaiveRetry,
  Loading,
} from "./components/LazyReact";
import React, { Suspense, useState } from "react";

const LazyConfettiCacheBusting = LazyReact(() => {
  return import("./components/ExpensiveComponent");
});
const LazyConfettiNaive = LazyReactNaiveRetry(() => {
  return import("./components/ExpensiveComponent");
});

enum Strategy {
  NONE,
  CACHE_BUSTING,
  NAIVE,
}
const lazyConfettiComponents = {
  [Strategy.CACHE_BUSTING]: LazyConfettiCacheBusting,
  [Strategy.NAIVE]: LazyConfettiNaive,
} as Record<Exclude<Strategy, Strategy.NONE>, React.ComponentType>;

function App() {
  const [strategy, setStrategy] = React.useState(Strategy.NONE);
  const LazyConfetti =
    strategy === Strategy.NONE
      ? null
      : (lazyConfettiComponents[strategy] as any);

  return (
    <div>
      <h2>Lazy React component with retries</h2>
      <p>
        Try{" "}
        <a href="https://stackoverflow.com/a/76200536/200987">
          blocking and then unblocking the requests for ExpensiveComponent
        </a>
      </p>
      <h1>React App</h1>

      {strategy !== Strategy.NONE ? (
        <Suspense fallback={<div>Loading...</div>}>
          <LazyConfetti />
        </Suspense>
      ) : (
        <>
          <h2>Choose strategy</h2>
          <button onClick={setStrategy.bind(null, Strategy.NAIVE)}>
            Naive retry
          </button>
          <button onClick={setStrategy.bind(null, Strategy.CACHE_BUSTING)}>
            Retry with cache busting
          </button>
        </>
      )}
    </div>
  );
}

export default App;
