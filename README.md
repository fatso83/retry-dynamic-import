# Retry dynamic imports

> Retry dynamic imports using cache busting and exponential backoff

<a href="https://www.npmjs.com/package/@fatso83/retry-dynamic-import/"><img src="https://img.shields.io/npm/v/@fatso83/retry-dynamic-import.svg?style=flat" alt="npm version"></a>

Did you know that the [HTML spec][html spec] demands that failed dynamic import resolutions are to be cached? Turns out, most people do not and only get to know this once they deploy apps using dynamic imports to production and start seeing weird errors after some time. Neither did I, and I ended up doing [a whole lot of debugging and googling][so-answer] after receiving mysterious bug reports from users before I found the [WHATWG issue][html spec issue] for exactly this situation. Since this has been at a stand still since 2021, I ended up creating this library to work around the issues.

[html spec]: https://html.spec.whatwg.org/#fetch-a-single-module-script
[html spec issue]: https://github.com/whatwg/html/issues/6768
[so-answer]: https://stackoverflow.com/a/76200536/200987

This package was originally a fork of Alon Mizrahi's work, but the new code no longer uses Alon's approach, which was relying on parsing
Chromium specific error messages, and the new approach works in Firefox and other browsers as well.

Completed improvements:

- ✅ unit tests
- ✅ support non-Chromium browsers (like Firefox)
- ✅ tree shakeable (does not pull in React if you just use the non-react bits)
- ✅ speed up resolution on afflicted clients by not waiting for first cache busting attempt
- ✅ fix exports to work with Typescript using both NodeNext and "classic" module resolution
- ❌ dual exports (currently just ESM), shout out if you want it (we already produce the `*.cjs` files)

## Why not just catch a failure and reload the page?

While that works fine in Firefox, in Chromium based browsers (Edge, Chrome, ...) a failed module import is _cached_ and that failure is _sticky_: it is not retried on reload or over browser restarts (per Chrome 113). That is _real_ failures, not DevTool URL blocking, which is _not sticky_, for whatever reason.

## Demo?

1. Open the [demo application that is deployed on Github Pages](https://fatso83.github.io/retry-dynamic-import/demo)
2. Open DevTools and refresh the page
3. Right click on the ExpensiveComponent.\* url and choose to block it
4. Refresh and see the network requests fail in the Network tab of DevTools
5. Unblock the url and see it work again

If you want to see the sticky behavior mentioned above, setup [Charles Proxy and its "Breakpoints" feature](https://www.charlesproxy.com/documentation/proxying/breakpoints/) to be able to selectively block or accept requests. Works great!

## Limitations

Transitive imports: read [this article](https://medium.com/@alonmiz1234/retry-dynamic-imports-with-react-lazy-c7755a7d557a) to understand the details
of how dynamic imports might fail and how this solves some of these use cases. One use case it cannot solve is if a transitive
dependency should fail to load.

## Installing

```
npm i @fatso83/retry-dynamic-import
```

## Usage

The package has two main exports

```javascript
export const dynamicImportWithRetry // default implementation with 5 retries
export const createDynamicImportWithRetry  // factory to make your own version of dynamicImportWithRetry
```

### Vanilla JS util

> Works in any framework

```typescript
import { dynamicImportWithRetry } from "@fatso83/retry-dynamic-import";
const myModule = dynamicImportWithRetry(() => import("./my-module")); // this works regardless of framework, lib, etc
```

See the unit tests or the implementation for what options it supports.

### Custom strategies
The `createDynamicImportWithRetry` factory recently got a new feature that allows you to pass in _your own custom strategy_ for dealing with imports, instead of the pre-defined ones. One specific use-case, shown in the tests, is that this opens up for supporting retries of _dynamic_ import paths. 

```typescript
// ONE-TIME SETUP
const moduleSpecifierSymbol = Symbol()
const lookupUsingSymbolInImporter: UrlStrategy = (_, importer) =>
    moduleSpecifierSymbol in importer
    ? String(importer[moduleSpecifierSymbol])
    : null;

const customRetryImport = createDynamicImportWithRetry(3, {strategy: lookupUsingSymbolInImporter})
// ...

// USE
// This can now be used with dynamically created paths like this
const path = readFromUser();
const importer = Object.assign(() => import(path), {
    [moduleSpecifierSymbol]: path,
});

await customRetryImport(importer)
```

### React utility

Additionallly, you can `import reactLazyWithRetry from '@fatso83/retry-dynamic-import/react-lazy'` for a utility that can be used instead of React.lazy() for lazy imports with retries. In version 1.\* this was exposed on root, but most bundlers were [unable to tree-shake React][issue-1], so I decided to make a breaking change for version 2 that exposes it as subpath export.

_React is an \_optional_ dependency of this package\_, which means you can use it with Svelte or VanillaJS without pulling in extra dependencies by specifying `npm install --omit=optional`, but if you use the `react-lazy` sub-export you will of course need to have React in your dependency tree :)

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

## Contributing

Please do!

- Run tests: `DEBUG=dynamic-import:* npm t -- --watch` (the env var is just for verbose output)

[issue-1]: https://github.com/fatso83/retry-dynamic-import/issues/1
