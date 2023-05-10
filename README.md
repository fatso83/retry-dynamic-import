# Retry dynamic imports

> Retry dynamic imports using cache busting and exponential backoff

This is a fork of Alon Mizrahi's work, made available as a package.

Completed improvements:
- ✅ unit tests
- ✅ support non-Chromium 
- ❌ cache previous resolutions

## Limitations
Transitive imports: read [this article](https://medium.com/@alonmiz1234/retry-dynamic-imports-with-react-lazy-c7755a7d557a) to understand the details
of how dynamic imports might fail and how this solves some of these use cases. One use case it cannot solve is if a transitive 
dependency should fail to load.

## Installing

```
npm i @fatso83/retry-dynamic-import
```

The package exposes three public methods

```
export const dynamicImportWithRetry // default implementation with 5 retries
export const createDynamicImportWithRetry  // factory to make your own version of dynamicImportWithRetry
export const reactLazyWithRetry // can be used instead of React.lazy(). Wraps around dynamicImportWithRetry
```

React is an optional dependency, which means you can use this with Svelte or VanillaJS without
pulling in extra dependencies.


## Usage

### Vanilla JS util

> Works in any framework

```typescript
const dynamicImportWithRetry = createDynamicImportWithRetry(5);

const myModule = dynamicImportWithRetry(() => import("./my-module")); // this works regardless of framework, lib, etc
```

See the unit tests or the implementation for what options it supports.

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
