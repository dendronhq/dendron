#!/bin/sh
echo "restoring packages..."
rm -rf packages/nextjs-template/node_modules/
rm -rf packages/plugin-core/node_modules
yarn
yarn bootstrap:build:dendron-next-server
yarn bootstrap:build:plugin-core