#!/bin/bash

echo "reset repo"
git checkout package.json

echo "remove compiled assets"
npx lerna run clean --parallel --scope "@dendronhq/{dendron-plugin-views,dendron-next-server,plugin-core}"

echo "link packages..."
lerna bootstrap

echo "re-building packages..."
# NOTE: order matters, must run serially
npx lerna run build --scope @dendronhq/dendron-next-server
npx lerna run build --scope @dendronhq/dendron-plugin-views
npx lerna run build --scope @dendronhq/plugin-core