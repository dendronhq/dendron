#!/bin/bash

echo "sync client assets..."
pushd ../dendron-next-server
yarn  --ignore-lockfile
yarn build
yarn gen:theme
rsync -avq out/ ../plugin-core/assets/static/ --delete
popd
echo "sync server assets..."
pushd ../api-server
rsync -avq assets/static/ ../plugin-core/assets/static/ 
popd
