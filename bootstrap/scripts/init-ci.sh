#!/bin/bash

set -euo pipefail

./bootstrap/scripts/bootstrap.sh --ci
./bootstrap/scripts/build.sh
cd packages/plugin-core/
./scripts/sync_vault.sh
