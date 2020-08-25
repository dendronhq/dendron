#!/bin/bash

echo "upgrading..."
lerna version prerelease
lerna publish from-package --ignore-scripts -y
git push
