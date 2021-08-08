
verdaccio &
FOO_PID=$!
echo "$FOO_PID"

sleep 3
LOG_LEVEL=info dendron dev build --upgradeType patch --publishEndpoint local

echo "killing "
kill $FOO_PID