#!/bin/bash

version=minor
lerna version $version 
lerna publish from-package --ignore-scripts
node bootstrap/scripts/genMeta.js