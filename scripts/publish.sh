#!/bin/bash

# TODO
#echo "gen readme..."
#ansible-playbook playbooks/genReadme.yml
echo "upgrading..."
cp README.md packages/plugin-core/
git add packages/plugin-core/README.md
git commit --amend --no-edit
lerna version patch
lerna publish from-package --ignore-scripts -y
git push
