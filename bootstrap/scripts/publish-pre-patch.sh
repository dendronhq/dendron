#!/bin/bash

echo "upgrading..."
lerna version prerelease
lerna publish from-package
node genMeta.js
git push
