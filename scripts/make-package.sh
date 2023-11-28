#!/bin/sh

#Exit on error
set -e

if [ ! -e package.json ]; then
    echo "Run me from the package root, please"
    exit 1
fi

rm -r pkg 2>/dev/null || :
mkdir pkg || :
cp -a dist/* pkg/
cp -a types/* pkg/
cp package.json pkg/
cp README.md pkg
