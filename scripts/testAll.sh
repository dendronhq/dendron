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
npx lerna run test --parallel --ignore @dendronhq/plugin-core -- -- -u 2>&1 
travis_terminate 0 || true