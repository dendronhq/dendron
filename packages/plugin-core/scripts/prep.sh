#!/bin/bash

echo "updating pkg"
rm ../../package.json
sed  -ibak 's/@dendronhq.plugin-core/dendron/' package.json
sed  -ibak 's/out\/src\/extension/dist\/extension/' package.json

cat package.json | jq '.repository = { "url": "https://github.com/dendronhq/dendron.git", "type": "git" }' > tmp.json
mv tmp.json package.json
