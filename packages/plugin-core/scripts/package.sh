#!/bin/bash

git reset --hard
git clean -f
git pull
# conform to vscode naming 
sed  -ibak 's/@dendronhq.plugin-core/dendron/' package.json
# use webpack
sed  -ibak 's/out\/extension/dist\/extension/' package.json
# ./scripts/syncAssets.sh
npm install
vsce package
