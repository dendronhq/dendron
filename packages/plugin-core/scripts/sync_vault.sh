#!/bin/bash

if [[ -d ./build ]]; then
    echo "pulling template..."
    cd build/dendron-template
    git pull
else
    echo "cloning template..."
    mkdir build
    cd build 
    git clone git@github.com:dendronhq/dendron-template.git
    cd dendron-template
fi
export TAG=$(git describe --tags)
echo "copying template $TAG..."
rm -R ../../assets/notes/vault 
cp -R vault ../../assets/notes/vault 
touch ../../assets/notes/$TAG