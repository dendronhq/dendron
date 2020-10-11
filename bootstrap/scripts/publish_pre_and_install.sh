#!/bin/bash

./publish-pre-patch.sh
./sleep.sh

pushd ../../build/dendron/packages/plugin-core
./scripts/pack_and_install.sh
popd