#!/usr/bin/env bash
# Build script specific for Nightly

echo "starting verdaccio with in-memory cache to speed up build time"
verdaccio -c ./bootstrap/data/verdaccio/config.yaml > verdaccio.log 2>&1 &
FOO_PID=$!
echo "$FOO_PID"
sleep 10

SCRIPT_BUILD_ENV=${BUILD_ENV:-local}
echo "building... upgrade: patch, endpoint: local build environment: $SCRIPT_BUILD_ENV"

DENDRON_CLI=./packages/dendron-cli/lib/bin/dendron-cli.js

if [ $EXTENSION_TARGET_SET = "set" ]; then
  EXTENSION_TARGET=--extensionTarget $1
else
  EXTENSION_TARGET=""
fi

LOG_LEVEL=info $DENDRON_CLI dev build --upgradeType patch --publishEndpoint local --extensionType nightly $EXTENSION_TARGET

echo "closing verdaccio - killing "
kill $FOO_PID

