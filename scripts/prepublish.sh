#!/bin/sh

#Exit on error
set -e
if [ ! -e package.json ]; then
    echo "Run me from the package root, please"
    exit 1
fi

run-s test build test-consumers
