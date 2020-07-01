#!/bin/bash
version=`cat package.json | jq ".version" -r`
code-insiders --install-extension "dendron-$version.vsix"