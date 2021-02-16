#!/bin/sh

version=$1
lerna version $version --no-git-tag-version --no-push
git add .
git commit -m "integ: publish $version"
git push
lerna publish from-package 