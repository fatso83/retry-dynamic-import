#!/bin/bash
# See https://github.com/microsoft/TypeScript/issues/56576
# and https://github.com/fatso83/retry-dynamic-import/tree/typescript-symlink-issue
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $SCRIPT_DIR/..

set -e

rm -r ./test-builds/node_modules/@fatso83/retry-dynamic-import 
mkdir ./test-builds/node_modules/@fatso83/retry-dynamic-import 
cp pkg/* ./test-builds/node_modules/@fatso83/retry-dynamic-import/

