./bootstrap/scripts/sleep.sh

echo "updating metadata..."
node bootstrap/scripts/genMeta.js

echo "updating installing..."
pushd build/dendron/packages/plugin-core
./scripts/pack_and_install.sh
popd