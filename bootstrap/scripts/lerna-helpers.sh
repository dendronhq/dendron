#!/bin/bash

function run() {
    cmd=$@
    echo $cmd
    eval $cmd || 0
}

function install() {
    package=$1
    scope=$2
    suffix=""
    if [[ -z $package || -z $scope ]]; then
        echo "install {package} {scope}"
    fi
    echo "install, args: $package $scope"
    if [ $scope ]; then
        suffix="--scope $scope"
    fi
    cmd="lerna add $package"
    run $cmd $suffix
    cmd="lerna add -D @types/$package"
    run $cmd $suffix
}
