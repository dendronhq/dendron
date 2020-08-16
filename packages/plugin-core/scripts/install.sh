#!/bin/bash

version=`cat package.json | jq ".version" -r`
name=`cat package.json | jq ".name" -r`
code-insiders --install-extension "$name-$version.vsix" --force
codium --install-extension "$name-$version.vsix" --force
