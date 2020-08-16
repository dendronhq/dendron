#!/bin/bash

export OVSX_PAT=`cat /Users/kevinlin/projects/dendronv2/dendron-playbooks/secrets/OVSX_PAT`

# echo "upgrade version..."
# yarn version --patch

# echo "publish..."
# vsce package

echo "publish to vscode..."
vsce publish

echo "publish to ovsx..."
ovsx publish

# echo "push..."
# git push