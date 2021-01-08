#!/bin/bash

echo "upgrading..."
lerna version minor
lerna publish from-package
git push
node genMeta.js
