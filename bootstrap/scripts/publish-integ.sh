#!/bin/sh

lerna version prerelease --no-git-tag-version --no-push
git add .
git commit -m "integ: publish"
git push
lerna publish from-package 