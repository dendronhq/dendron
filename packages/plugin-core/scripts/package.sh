#!/bin/bash

git reset --hard
git clean -f
git pull
sed  -ibak 's/@dendronhq.plugin-core/dendron/' package.json 
./syncAssets.sh
npm install
rm *.vsix
vsce package