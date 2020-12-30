#!/bin/bash

echo "building next-server"
pushd ../dendron-next-server
npm install
npm build

rsync -avq out/ ../plugin-core/assets/static/ --delete
popd
