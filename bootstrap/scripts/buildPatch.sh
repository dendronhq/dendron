if [ $PUBLISH_ENDPOINT = "local" ]; then
	echo "start verdaccio"
	verdaccio > verdaccio.log 2>&1 &
	FOO_PID=$!
	echo "$FOO_PID"
	sleep 3
fi

SCRIPT_BUILD_ENV=${BUILD_ENV:-local}
echo "building... upgrade: $UPGRADE_TYPE, endpoint: $PUBLISH_ENDPOINT build environment: $SCRIPT_BUILD_ENV"
if [ $SCRIPT_BUILD_ENV = "ci" ]; then
  if [ $PUBLISH_ENDPOINT = "local" ]; then
  	echo "npm login with local account"
	  yarn setup:npmlogin:local
	elif [ $PUBLISH_ENDPOINT = "remote" ]; then
  	echo "npm login with remote npm registry account"
	  yarn setup:npmlogin:remote
	fi
fi

DENDRON_CLI=dendron
if [ $SCRIPT_BUILD_ENV = "ci" ]; then
  DENDRON_CLI=./packages/dendron-cli/lib/bin/dendron-cli.js
fi

if [ -z $FAST ]; then
	LOG_LEVEL=info $DENDRON_CLI dev build --upgradeType $UPGRADE_TYPE --publishEndpoint $PUBLISH_ENDPOINT --part1
	LOG_LEVEL=info $DENDRON_CLI dev build --upgradeType $UPGRADE_TYPE --publishEndpoint $PUBLISH_ENDPOINT --part2
else
	echo "running fast mode..."
	SKIP_SENTRY=1 LOG_LEVEL=info $DENDRON_CLI dev build --upgradeType $UPGRADE_TYPE --publishEndpoint $PUBLISH_ENDPOINT --fast
fi

if [ $PUBLISH_ENDPOINT = "local" ]; then
	echo "killing "
	kill $FOO_PID
fi