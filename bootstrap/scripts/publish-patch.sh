#!/bin/bash

echo "upgrading..."
lerna version patch
lerna publish from-package -y
git push

./pack_and_install.sh