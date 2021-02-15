#!/bin/sh

function cdvs() {
    version=`cat package.json | jq ".version" -r`
    pushd ~/.vscode-insiders/extensions/dendron.dendron-$version
}

function setRegLocal() {
    yarn config set registry http://localhost:4873
    npm set registry http://localhost:4873/
}

function setRegRemote() {
    yarn config set registry https://registry.npmjs.org/
    npm set registry https://registry.npmjs.org/
}