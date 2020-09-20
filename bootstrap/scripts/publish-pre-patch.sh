#!/bin/bash

echo "upgrading..."
lerna version prerelease
lerna publish from-package
git push
