#!/bin/bash
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $SCRIPT_DIR/..

if [ ! -e package.json ]; then
    echo "Run me from the package root, please"
    exit 1
fi

VERSION=`jq .version package.json`
NAME=`jq .name package.json`

# needed for make-package
export PATH="./node_modules/.bin":$PATH

#Exit on error
set -e

main(){
    verify
    build
    publish
    postpublish
}

verify(){
    CURRENT=$(git branch --show-current)
    if [[ "$CURRENT" != "main" ]]; then
        echo "Not on main branch"
        exit 1
    fi

    git pull --rebase
}

build(){
    echo Running build step
    npm run build
}

publish(){
    echo Running publish step

    local build_dir=$(mktemp -d)
    ./scripts/make-package.sh
    npm pack --pack-destination "$build_dir" ./pkg 2>/dev/null

    local file="$build_dir"/*.tgz
    local count=$(tar tf  $file | egrep '(d.ts|.js)$' | wc -l)

    if (( $count < 7 )); then 
        echo "Expected to find at least 7 js and d.ts files. Found $count."
        exit 
    fi

    npm publish $file
}

postpublish(){
    echo Running postpublish step

    git fetch --all
    git checkout main
    git rebase
    git checkout test-builds/package-lock.json
    git checkout gh-pages
    git reset --hard origin/gh-pages
    git merge main -m "Merging main into gh-pages"
    npm run build:demo-gh-pages
    rm -r docs && mkdir -p docs/demo
    cp -r demo/dist/* docs/demo/
    cp README.md docs/README.md
    git add docs
    git cm "Updating Github Pages with new content" | : # handle empty commit / no changes
    git push origin main gh-pages && git push --tags
    git switch main
}

if [[ $# == 1 ]]; then
    eval $1
else
    main
fi
