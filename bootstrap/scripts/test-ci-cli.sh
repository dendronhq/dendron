#!/bin/bash

npx lerna run test --ignore @dendronhq/plugin-core --concurrency 1 --stream -- -- --forceExit $@ 2>&1
