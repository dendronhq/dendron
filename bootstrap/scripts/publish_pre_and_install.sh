#!/bin/bash

./publish-pre-patch.sh
retVal=$?
if [ $retVal -ne 0 ]; then
    echo "Error"
    exit
fi
./sleep.sh

pushd ../../build/dendron/packages/plugin-core
./scripts/pack_and_install.sh
popd
