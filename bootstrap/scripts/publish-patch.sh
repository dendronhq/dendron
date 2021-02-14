#!/bin/bash

echo "upgrading..."
lerna version patch
lerna publish from-package 
git push
./bootstrap/scripts/pack_and_install.sh