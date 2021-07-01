#!/bin/bash

git branch -D integ-publish
git checkout -b integ-publish

version=patch
lerna version $version --no-push --no-git-tag-version

git add .
git commit -m "chore: publish $version"
git push --set-upstream origin integ-publish --force --no-verify

lerna publish from-package --ignore-scripts
node bootstrap/scripts/genMeta.js