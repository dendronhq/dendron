#!/bin/bash

# TODO: snotify stub
lerna run test --ignore @dendronhq/plugin-core && snotify ok || snotify bad
