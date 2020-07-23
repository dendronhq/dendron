#!/bin/bash

git reset --hard
git clean -f
git pull
# conform to vscode naming  convention
sed  -ibak 's/@dendronhq.plugin-core/dendron/' package.json
sed  -ibak 's/out\/extension/dist\/extension/' package.json

./scripts/sync_vault.sh
npm install
vsce package
