#!/bin/bash

version=`cat package.json | jq ".version" -r`
name="dendron"
code-insiders --install-extension "$name-$version.vsix" --force
codium --install-extension "$name-$version.vsix" --force
