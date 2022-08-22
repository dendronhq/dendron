#!/bin/bash

# sed -ibak "/AWK_COMMENT/d" packages/engine-server/src/drivers/SQLiteMetadataStore.ts
# sed -ibak '/AWK_UNCOMMENT/s/^\/\///g' packages/engine-server/src/drivers/SQLiteMetadataStore.ts
# yarn lerna run build --scope @dendronhq/engine-server
# git add packages/engine-server/src/drivers/SQLiteMetadataStore.ts packages/engine-server/src/drivers/SQLiteMetadataStore.tsbak 
# git commit -m "tmp commit"