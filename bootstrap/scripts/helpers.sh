#!/bin/sh

function cdvs() {
    version=`cat package.json | jq ".version" -r`
    pushd ~/.vscode-insiders/extensions/dendron.dendron-$version
}