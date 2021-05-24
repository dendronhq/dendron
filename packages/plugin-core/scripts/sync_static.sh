#!/bin/bash

echo "building next-server"
pushd ../dendron-next-server
yarn  --ignore-lockfile
yarn build
yarn gen:theme
rsync -avq out/ ../plugin-core/assets/static/ --delete
popd
