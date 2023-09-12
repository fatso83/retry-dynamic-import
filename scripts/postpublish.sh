#!/bin/sh

#Exit on error
set -e

if [ ! -e package.json ]; then
    echo "Run me from the package root, please"
    exit 1
fi

VERSION=`jq .version package.json`
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
