#!/bin/bash

echo "bootstrapping..."
npx lerna bootstrap 
    \ --scope @dendronhq/common-all 
    \ --scope @dendronhq/common-server 
    \ --scope @dendronhq/engine-server 
    \ --scope @dendronhq/plugin-core 
    \ --scope @dendronhq/dendron-cli 
    \ --scope @dendronhq/pods-core 
    \ --scope @dendronhq/seeds-core 
    \ --scope @dendronhq/lsp-server 
    \ --scope @dendronhq/api-server
    \ --scope @dendronhq/common-test-utils