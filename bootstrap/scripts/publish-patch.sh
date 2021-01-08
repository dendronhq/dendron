#!/bin/bash

echo "upgrading..."
# npm run release -- --patch --no-verify --no-git-tag-version --no-push
lerna version patch
lerna publish from-package -y
git push
node genMeta.js


