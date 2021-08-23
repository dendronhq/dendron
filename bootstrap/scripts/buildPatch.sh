if [ $PUBLISH_ENDPOINT = "local" ]; then
	echo "start verdaccio"
	verdaccio &
	FOO_PID=$!
	echo "$FOO_PID"
	echo "npm login"
	yarn setup:npmlogin
	sleep 3
fi

echo "building... upgrade: $UPGRADE_TYPE, endpoint: $PUBLISH_ENDPOINT"

LOG_LEVEL=info ./packages/dendron-cli/lib/bin/dendron-cli.js dev build --upgradeType $UPGRADE_TYPE --publishEndpoint $PUBLISH_ENDPOINT

if [ $PUBLISH_ENDPOINT = "local" ]; then
	echo "killing "
	kill $FOO_PID
fi