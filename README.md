# Verification of Typescript Symlink issue

This branch is a demonstration of how the `tsc` command in Typescript 5 (and probably earlier)
does not consider types included in local (folder relative) packages.

To demonstrate, first clone the project and execute the following from the terminal in the project's root:
```
npm install
npm run build
npm run install-build-dep
ls -lh ./test-builds/node_modules/@fatso83/
```

The `test-builds` directory references the package version as `../pkg`. 
When doing `npm i` this will create a symlink in `node_modules`, so the output of the last 
command should be this:
```
total 0
lrwxr-xr-x  1 carlerik  staff    12B 28 nov 19:36 retry-dynamic-import -> ../../../pkg
```

Now try running
```
npm run test-consumers
```
This will run the standard tests present in the `./test-builds` directory. To
demonstrate this does not use the definition files at all, try removing them:

```
rm ./test-builds/node_modules/@fatso83/retry-dynamic-import/*.d.ts
npm run test-consumers
```

The tests still run! Now, to show how the symlink makes all the difference, lets
create the dependency directory without any symlinks and run the tests again:
```
npm run build
rm ./test-builds/node_modules/@fatso83/retry-dynamic-import
mkdir ./test-builds/node_modules/@fatso83/retry-dynamic-import
cp ./pkg/* ./test-builds/node_modules/@fatso83/retry-dynamic-import/
npm run test-consumers
```

You should now get several typescript errors, among which are some 
about duplicate identifiers and `Exports and export assignments are not permitted in module augmentations.`

This demonstrates that `tsc` ignores types in symlinked directories, even if Node should work fine.
