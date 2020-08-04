#!/bin/bash

echo "publish to vscode..."
vsce publish
export OVSX_PAT=`cat ../../../OVSX_PAT`
echo "publish to ovsx..."
ovsx publish
