#!/bin/bash

echo "upgrading..."
lerna version patch
lerna publish from-package 
git push
node bootstrap/scripts/genMeta.js
./bootstrap/scripts/pack_and_install.sh