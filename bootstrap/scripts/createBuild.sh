#!/bin/bash

git branch -D integ-publish
git checkout -b integ-publish

version=prerelease
lerna version $version --no-git-tag-version --no-push

git add .
git commit -m "integ: publish $version"
git push --set-upstream origin integ-publish --force --no-verify

lerna publish from-package --ignore-scripts
node bootstrap/scripts/genMeta.js