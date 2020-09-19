#!/bin/bash

echo "upgrading..."
lerna version prerelease
lerna publish 
git push
