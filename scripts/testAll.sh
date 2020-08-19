#!/bin/bash

npx lerna run test --parallel --ignore @dendronhq/plugin-core -- -- -u 2>&1
