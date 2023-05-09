# Retry dynamic imports 
> Retry dynamic imports using cache busting and exponential backoff

Fork of Alon Mizrahi's work to solidify with tests, support more browsers, improve perf with caching, etc. 

The package exposes
```
export const dynamicImportWithRetry // default implementation with 5 retries
export const createDynamicImportWithRetry  // make your own version of dynamicImportWithRetry
export const reactLazy // can be used instead of React.lazy(). Wraps around dynamicImportWithRetry
```


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


### LazyReact
Thin wrapper around the above

```tsx
const LazyAbout = LazyReact(() => import("./components/About"));
const LazyHome = LazyReact(() => import("./components/Home"));

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
