#!/bin/bash

version=minor
lerna version $version --no-push
lerna publish from-package --ignore-scripts
node bootstrap/scripts/genMeta.js
./bootstrap/scripts/patch11tyVersion.sh