#!/bin/sh

#Exit on error
set -e

if [ ! -e package.json ]; then
    echo "Run me from the package root, please"
    exit 1
fi

cp types/index.d.ts types/index-all.d.ts

echo '
import type reactLazy from "./react-lazy.d.ts"

declare module "@fatso83/retry-dynamic-import/react-lazy" {
    export default reactLazy
}

declare module "@fatso83/retry-dynamic-import/react-lazy.js" {
    export default reactLazy
}' >> types/index-all.d.ts

rm -r pkg || :
mkdir pkg || :
cp -a dist/* pkg/
cp -a types/* pkg/
cp package.json pkg/
