#!/bin/bash

# TODO: snotify stub
lerna run test --parallel --ignore @dendronhq/plugin-core -- 2>&1 | tee /tmp/testAll.log
# use below to update snapshots
# lerna run test --parallel --ignore @dendronhq/plugin-core -- -- -u 2>&1 | tee /tmp/testAll.log
