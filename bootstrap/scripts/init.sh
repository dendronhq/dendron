#!/bin/bash

set -euo pipefail

npm run-script bootstrap:init

cd packages/plugin-core/
./scripts/sync_vault.sh
