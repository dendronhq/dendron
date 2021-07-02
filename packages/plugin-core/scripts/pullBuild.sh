#!/bin/bash

./scripts/prep.sh
./scripts/pack_and_install.sh 2>&1 | tee /tmp/out.txt