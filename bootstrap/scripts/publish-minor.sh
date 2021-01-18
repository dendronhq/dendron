#!/bin/bash

echo "upgrading..."
lerna version minor
lerna publish from-package
git push
node bootstrap/scripts/genMeta.js
