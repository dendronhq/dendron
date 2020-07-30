#!/bin/bash


if [[ -d ./build ]]; then
    echo "pulling template..."
    cd build/dendron-template
    git pull
else
    echo "cloning template..."
    mkdir build
    cd build 
    git clone git@github.com:dendronhq/dendron-template.git
    cd dendron-template
fi
export LAST_COMMIT=$(git rev-parse HEAD)
echo "sync $LAST_COMMIT..."

rm -rf ../../assets/dendronWS || true
mkdir  ../../assets/dendronWS
# TODO: figure out why --delete option doesn't work
rsync -av * ../../assets/dendronWS/ --exclude .git --exclude package.json --exclude CNAME --exclude scripts --exclude LICENSE  --exclude dendron.code-workspace --exclude docs/notes

echo $LAST_COMMIT > ../../assets/LAST_COMMIT
cd ../../assets/dendronWS
git init 
git add .
git commit -m "initial commit"


# echo "copy notes..."
# mkdir  ../../assets/dendronWS/notes
# cp -R vault ../../assets/dendronWS/notes/vault 

# echo "copy docs..."
# rm -Rf ../../assets/docs || true
# mkdir  ../../assets/docs
# cp -R docs/Gemfile ../../assets/docs
# cp -R docs/Gemfile.lock ../../assets/docs
# cp -R docs/_config.yml ../../assets/docs
# cp -R docs/assets ../../assets/docs
