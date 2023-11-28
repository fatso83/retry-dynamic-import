#!/bin/bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $SCRIPT_DIR/..

set -e

CURRENT=$(git branch --show-current)
if [[ "$CURRENT" != "main" ]]; then
    echo "Not on main branch ... switching"
    sleep 2
    git checkout main
fi
git pull

# don't set this as a NPM run prebuild script as I 
# don't want to run this every time I build, just 
# to ensure all is OK before versioning
npm run install-build-deps
./node_modules/.bin/run-s test build test-consumers
