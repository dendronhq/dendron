#!/bin/bash

echo "upgrading..."
lerna version prepatch
lerna publish from-package --ignore-scripts -y
git push
