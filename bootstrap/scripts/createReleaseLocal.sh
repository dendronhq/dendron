#!/bin/bash

git branch -D integ-publish
git checkout -b integ-publish

version=minor
lerna version $version --no-git-tag-version 

git add .
git commit -m "chore: publish $version"
git push --set-upstream origin integ-publish --force

lerna publish from-package --ignore-scripts
node bootstrap/scripts/genMeta.js
./bootstrap/scripts/patch11tyVersion.sh