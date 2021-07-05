
#!/bin/bash
./scripts/prep.sh
yarn install --no-lockfile
./sync_static.sh
./scripts/pack_and_install.sh 2>&1 | tee /tmp/out.txt