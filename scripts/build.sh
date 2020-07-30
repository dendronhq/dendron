#!/bin/bash

echo "bootstrapping..."
npx lerna bootstrap --scope @dendronhq/common-all  --scope @dendronhq/common-server --scope @dendronhq/engine-server --scope @dendronhq/plugin-core --scope @dendronhq/dendron-cli

echo "building..."
npx lerna run build --scope @dendronhq/common-all
npx lerna run build --scope @dendronhq/common-server
npx lerna run build --scope @dendronhq/engine-server
npx lerna run build --scope @dendronhq/dendron-cli
npx lerna run build --scope @dendronhq/plugin-core

echo "init template..."
pushd packages/plugin-core/
./scripts/sync_vault.sh
