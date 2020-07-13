#!/bin/bash
version=`cat package.json | jq ".version" -r`
code-insiders --install-extension "dendron-$version.vsix"

# NOTE: if you want to install in code instead, use the following line
# code --install-extension "dendron-$version.vsix"