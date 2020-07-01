#!/bin/bash

git reset --hard
git clean -f
git pull
sed  -ibak 's/@dendronhq.plugin/dendron/' package.json
npm install
npm run build
version=`cat package.json | jq ".version" -r`
rm *.vsix
vsce package
