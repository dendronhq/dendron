#!/usr/bin/env bash
# Build script specific for Nightly

echo "starting verdaccio with in-memory cache to speed up build time"
verdaccio -c ./bootstrap/data/verdaccio/config.yaml > verdaccio.log 2>&1 &
FOO_PID=$!
echo "$FOO_PID"
sleep 10

SCRIPT_BUILD_ENV=${BUILD_ENV:-local}
SCRIPT_EXT_TYPE=${EXT_TYPE:-dendron}
echo "building... upgrade: patch, endpoint: local build environment: $SCRIPT_BUILD_ENV"

DENDRON_CLI=./packages/dendron-cli/lib/bin/dendron-cli.js

LOG_LEVEL=info $DENDRON_CLI dev build --upgradeType patch --publishEndpoint local --extensionType nightly 

echo "closing verdaccio - killing "
kill $FOO_PID

