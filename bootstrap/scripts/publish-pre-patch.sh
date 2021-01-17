#!/bin/bash

echo "upgrading..."
lerna version prerelease
lerna publish from-package
node bootstrap/scripts/genMeta.js
git push
