#!/bin/bash

git reset --hard
git clean -f
git pull
sed  -ibak 's/@dendronhq.plugin-core/dendron/' package.json 
npm install
npm run build
rm *.vsix
vsce package
