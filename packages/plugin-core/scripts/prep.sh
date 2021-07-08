#!/bin/bash

git reset --hard
git clean -f
git checkout master
git fetch
git branch -D integ-publish
git checkout --track origin/integ-publish
git clean -f

echo "updating pkg"
rm ../../package.json
sed  -ibak 's/@dendronhq.plugin-core/dendron/' package.json
sed  -ibak 's/out\/src\/extension/dist\/extension/' package.json

cat package.json | jq '.repository = { "url": "https://github.com/dendronhq/dendron.git", "type": "git" }' > tmp.json
mv tmp.json package.json