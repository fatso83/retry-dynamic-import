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
# Publish runtime metadata only; source build/test hooks must not run from pkg/.
node --input-type=module <<'JS'
import fs from 'node:fs';
const manifest = JSON.parse(fs.readFileSync('package.json', 'utf8'));
delete manifest.scripts;
delete manifest.devDependencies;
delete manifest.volta;
fs.writeFileSync('pkg/package.json', JSON.stringify(manifest, null, 2) + '\n');
JS
cp README.md pkg
cp LICENSE pkg/
