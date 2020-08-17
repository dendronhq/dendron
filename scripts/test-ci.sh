#!/bin/bash

echo "run CI test..."
npx lerna run test --parallel -- -- -u 2>&1

travis_terminate() {
  set +e
  pkill -9 -P $$ &> /dev/null || true
  exit $1
}
travis_terminate 0
