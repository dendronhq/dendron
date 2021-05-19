#!/bin/bash

rm -rf node_modules
#rm yarn-error.log  && echo
find packages -name "node_modules" -type d -prune -exec rm -rf '{}' +
find packages -type f -name package-lock.json -exec rm {} +
find packages -type f -name yarn-error.log -exec rm {} +
