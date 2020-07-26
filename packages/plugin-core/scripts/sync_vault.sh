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
export LAST_COMMIT=$(git rev-parse HEAD)
echo "copying template $LAST_COMMIT..."
rm -R ../../assets/notes || true
mkdir  ../../assets/notes
cp -R vault ../../assets/notes/vault 
echo $LAST_COMMIT > ../../assets/notes/LAST_COMMIT