#!/bin/bash

find packages -name "node_modules" -type d -prune -exec rm -rf '{}' +
find packages -type f -name yarn.lock -exec rm -rf '{}' +
find packages -type f -name package-lock.json -exec rm {} +

