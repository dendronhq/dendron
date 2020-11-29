#!/bin/bash



echo "building next-server"
pushd ../dendron-next-server
yarn
yarn build

rsync -avq out/ ../plugin-core/assets/static/ --delete
popd