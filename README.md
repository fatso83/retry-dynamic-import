# Retry dynamic imports 
> Retry dynamic imports using cache busting and exponential backoff

Fork of Alon Mizrahi's work and make it available as a package.

I added unit tests and packaging, but will hopefully support more browsers, improve perf with caching, etc. 

## Installing
```
npm i @fatso83/retry-dynamic-import
```

The package exposes
```
export const dynamicImportWithRetry // default implementation with 5 retries
export const createDynamicImportWithRetry  // make your own version of dynamicImportWithRetry
export const reactLazyWithRetry // can be used instead of React.lazy(). Wraps around dynamicImportWithRetry
```

React is an optional dependency, which means you can use this with Svelte or VanillaJS without
pulling in extra dependencies.


## Limitations
Read [this article](https://medium.com/@alonmiz1234/retry-dynamic-imports-with-react-lazy-c7755a7d557a) to understand the details
of how dynamic imports might fail and how this solves some of these use cases. One use case it cannot solve is if a transitive 
dependency should fail to load.


## Usage

### Vanilla JS util 
> Works in any framework

```typescript
const dynamicImportWithRetry = createDynamicImportWithRetry(5);

const myModule = dynamicImportWithRetry( () => import('./my-module')) // this works regardless of framework, lib, etc
```


### reactLazyWithRetry
Thin wrapper around the above, calling out to `React.lazy()`

```tsx
const LazyAbout = reactLazyWithRetry(() => import("./components/About"));
const LazyHome = reactLazyWithRetry(() => import("./components/Home"));

const App = () => (
  <Router>
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/" element={<LazyHome />} />
        <Route path="/about" element={<LazyAbout />} />
      </Routes>
    </Suspense>
  </Router>
);
```
