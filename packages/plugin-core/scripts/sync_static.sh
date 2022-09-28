#!/bin/bash

echo "sync client assets..."
pushd ../common-assets
yarn  --ignore-lockfile
yarn build
rsync -avq out/ ../plugin-core/assets/static/ --delete
rsync -avq assets/js ../plugin-core/assets/static/
popd
echo "sync server assets..."
pushd ../api-server
rsync -avq assets/static/ ../plugin-core/assets/static/ 
popd
