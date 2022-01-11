#!/bin/bash

# Remove all compiled assets

rm -rf node_modules
find packages -name "node_modules" -type d -prune -exec rm -rf '{}' +
find packages -type f -name yarn-error.log -exec rm {} +
npx lerna run clean --parallel --scope "@dendronhq/{dendron-plugin-views,dendron-next-server,plugin-core,nextjs-template}"
