#!/bin/bash

npx lerna run test --parallel --ignore @dendronhq/plugin-core --ignore @dendronhq/nextjs-template -- -- -u 2>&1
