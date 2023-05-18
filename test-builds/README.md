# Verification of correct types and exports

I have now gotten this working and verified to work as correctly with all the combinations I could think make sense:

- typescript with default module resolution
- typescript with nodenext module resolution
- typescript with default module resolution that pulls in react

When not using the React export, it is not bundled in and the types compile fine in all cases 🥳

<details>

```
$ npm t

> consumer-tests@1.0.0 test
> run-s typecheck build && ! (grep -i react typescript-moduleresolution-*/dist/assets/*)


> consumer-tests@1.0.0 typecheck
> run-p typecheck:*


> consumer-tests@1.0.0 typecheck:ts-default
> npx tsc --noEmit typescript-moduleresolution-default/src/main.ts


> consumer-tests@1.0.0 typecheck:ts-nodenext
> npx tsc --noEmit --allowImportingTsExtensions --moduleResolution nodenext typescript-moduleresolution-nodenext/src/main.ts


> consumer-tests@1.0.0 typecheck:ts-react-default
> tsc --noEmit --allowImportingTsExtensions  typescript-react-moduleresolution-default/src/main.ts


> consumer-tests@1.0.0 build
> for f in typescript-*; do vite build $f; done

vite v4.3.6 building for production...
✓ 8 modules transformed.
dist/index.html                    0.31 kB │ gzip: 0.23 kB
dist/assets/index-3dd79a12.css     0.95 kB │ gzip: 0.52 kB
dist/assets/my-module-4dc61aac.js  0.03 kB │ gzip: 0.05 kB
dist/assets/index-28ef90d0.js      2.54 kB │ gzip: 1.34 kB
✓ built in 334ms
vite v4.3.6 building for production...
✓ 8 modules transformed.
dist/index.html                    0.31 kB │ gzip: 0.23 kB
dist/assets/index-3dd79a12.css     0.95 kB │ gzip: 0.52 kB
dist/assets/my-module-4dc61aac.js  0.03 kB │ gzip: 0.05 kB
dist/assets/index-28ef90d0.js      2.54 kB │ gzip: 1.34 kB
✓ built in 328ms
vite v4.3.6 building for production...
✓ 14 modules transformed.
dist/index.html                    0.31 kB │ gzip: 0.23 kB
dist/assets/index-3dd79a12.css     0.95 kB │ gzip: 0.52 kB
dist/assets/my-module-4dc61aac.js  0.03 kB │ gzip: 0.05 kB
dist/assets/index-b13c5809.js      9.29 kB │ gzip: 3.93 kB
✓ built in 484ms
```

</details>
