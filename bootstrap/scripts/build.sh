#!/bin/bash

echo "building..."
npx lerna run build --scope @dendronhq/common-all || exit 1
npx lerna run build --scope @dendronhq/common-server  || exit 1

npx lerna run build --scope @dendronhq/common-test-utils || exit 1

npx lerna run build --scope @dendronhq/engine-server  || exit 1
npx lerna run build --scope @dendronhq/lsp-server  || exit 1
npx lerna run build --scope @dendronhq/api-server  || exit 1
npx lerna run build --scope @dendronhq/dendron-next-server  || exit 1

npx lerna run build --scope @dendronhq/dendron-cli  || exit 1
npx lerna run build --scope @dendronhq/pods-core  || exit 1
npx lerna run build --scope @dendronhq/seeds-core  || exit 1

npx lerna run build --scope @dendronhq/plugin-core  || exit 1