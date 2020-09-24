#!/bin/bash


if [[ -d ./build ]]; then
    echo "pulling template..."
    cd build/dendron-template
    git pull
else
    echo "cloning template..."
    mkdir build
    cd build 
    git clone https://github.com/dendronhq/dendron-template.git
    cd dendron-template
fi
export LAST_COMMIT=$(git rev-parse HEAD)
echo "sync $LAST_COMMIT..."

rm -rf ../../assets/dendronWS || true
mkdir  ../../assets/dendronWS
# TODO: figure out why --delete option doesn't work
rsync -avq * ../../assets/dendronWS/ --exclude .git --exclude package.json --exclude CNAME --exclude scripts --exclude LICENSE.md  --exclude dendron.code-workspace --exclude docs/notes --delete

echo $LAST_COMMIT > ../../assets/LAST_COMMIT