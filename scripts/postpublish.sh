#!/bin/sh

#Exit on error
set -e

if [ ! -e package.json ]; then
    echo "Run me from the package root, please"
    exit 1
fi

VERSION=`jq .version package.json`
git checkout gh-pages
git merge main -m "Merging $VERSION into gh-pages"
npm run build:demo-gh-pages
rm -r docs && mkdir docs
cp -r demo/dist/* docs/
git add docs
git cm "Updating Github Pages"
git push && git push --tags
