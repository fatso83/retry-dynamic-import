#Exit on error
set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $SCRIPT_DIR/..

export PATH=$(npm bin):$PATH

./scripts/prepublish.sh

npm publish ./pkg

./scripts/postpublish.sh
