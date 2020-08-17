#!/bin/bash

usage="testAll.sh [flags]"

flags=""
if [ -n "$1" ]
then
    flags="-- $1"
fi

# cmd="lerna run test --parallel --ignore @dendronhq/plugin-core -- $flags 2>&1 | tee /tmp/testAll.log"
# eval $cmd
# use below to update snapshots
if [[ -n $CI ]]; then
    echo "run local test..."
    npx lerna run test --parallel --ignore @dendronhq/plugin-core -- -- -u 2>&1
else
    echo "run CI test..."
    npx lerna run test --parallel -- -- -u 2>&1
fi

travis_terminate() {
  set +e
  pkill -9 -P $$ &> /dev/null || true
  exit $1
}
travis_terminate 0
