#!/bin/bash

git reset --hard
git clean -f
git checkout master
git fetch
git branch -D integ-publish
git checkout --track origin/integ-publish
./scripts/pack_and_install.sh 2>&1 | tee /tmp/out.txt