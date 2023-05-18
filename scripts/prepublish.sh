#!/bin/bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $SCRIPT_DIR/..

set -e
export PATH=$(npm bin):$PATH

run-s test build test-consumers
