
#!/bin/bash
./scripts/prep.sh
yarn install --no-lockfile
./scripts/pack_and_install.sh 2>&1 | tee /tmp/out.txt
./sync_static.sh
./scripts/pack_and_install.sh 2>&1 | tee /tmp/out.txt