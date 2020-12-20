#!/bin/bash

./bootstrap/scripts/bootstrap.sh
./bootstrap/scripts/build.sh
cd packages/plugin-core/
./scripts/sync_vault.sh