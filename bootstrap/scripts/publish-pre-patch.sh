#!/bin/bash

echo "upgrading..."
npm run release -- --prerelease alpha --no-verify --no-git-tag-version --no-push
lerna version prerelease
lerna publish from-package --ignore-scripts -y
git push
