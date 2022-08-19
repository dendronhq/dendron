#!/usr/bin/env bash
# Build plugin for CI and release
# TODO: `buildPatch.sh` is a bad name - it should just be `buildPlugin`

if [ $PUBLISH_ENDPOINT = "local" ] && [ -z $USE_IN_MEMORY_REGISTRY ] ; then
	echo "start verdaccio"
	verdaccio > verdaccio.log 2>&1 &
	FOO_PID=$!
	echo "$FOO_PID"
	sleep 3
fi
if [ $PUBLISH_ENDPOINT = "local" ] && [ $USE_IN_MEMORY_REGISTRY ] ; then
	echo "starting verdaccio with in-memory cache to speed up build time"
	verdaccio -c ./bootstrap/data/verdaccio/config.yaml > verdaccio.log 2>&1 &
	FOO_PID=$!
	echo "$FOO_PID"
	sleep 10
fi


SCRIPT_BUILD_ENV=${BUILD_ENV:-local}
SCRIPT_EXT_TARGET=${EXT_TARGET:-dendron}
echo "building... upgrade: $UPGRADE_TYPE, endpoint: $PUBLISH_ENDPOINT build environment: $SCRIPT_BUILD_ENV"

DENDRON_CLI=dendron
if [ $SCRIPT_BUILD_ENV = "ci" ]; then
  DENDRON_CLI=./packages/dendron-cli/lib/bin/dendron-cli.js
fi

EXT_TARGET=dendron
if [ $SCRIPT_EXT_TARGET = "nightly" ]; then
  EXT_TARGET=nightly
fi

if [ -z $FAST ]; then
	LOG_LEVEL=info $DENDRON_CLI dev build --upgradeType $UPGRADE_TYPE --publishEndpoint $PUBLISH_ENDPOINT --extensionTarget $EXT_TARGET
else
	echo "running fast mode..."
	SKIP_SENTRY=1 LOG_LEVEL=info $DENDRON_CLI dev build --upgradeType $UPGRADE_TYPE --publishEndpoint $PUBLISH_ENDPOINT --fast --extensionTarget $EXT_TARGET
fi

if [ $PUBLISH_ENDPOINT = "local" ]; then
	echo "killing "
	kill $FOO_PID
fi
