#!/bin/bash

# Watch all packages required for building dendron repo

echo "watching..."
npx lerna run watch --parallel 
    \ --scope @dendronhq/common-all 
    \ --scope @dendronhq/common-server 
    \ --scope @dendronhq/engine-server 
    \ --scope @dendronhq/plugin-core 
    \ --scope @dendronhq/dendron-cli 
    \ --scope @dendronhq/pods-core 
    \ --scope @dendronhq/api-server
    \ --scope @dendronhq/dendron-next-server
    \ --scope @dendronhq/common-test-utils
    \ --scope @dendronhq/engine-test-utils
    \ --scope @dendronhq/bootstrap