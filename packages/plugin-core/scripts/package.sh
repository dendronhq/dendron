#!/bin/bash

git reset --hard
git clean -f
git pull
# conform to vscode naming  convention
sed  -ibak 's/@dendronhq.plugin-core/dendron/' package.json
sed  -ibak 's/out\/extension/dist\/extension/' package.json

cat package.json | jq '.repository = { "url": "https://github.com/dendronhq/dendron.git", "type": "git" }' > tmp.json
mv tmp.json package.json

#./scripts/sync_static.sh
yarn install
vsce package --yarn