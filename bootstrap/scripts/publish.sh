#!/bin/bash

echo "upgrading..."
npm run release -- --dry-run > /tmp/updates.txt
lerna version patch
lerna publish from-package --ignore-scripts -y
git push
