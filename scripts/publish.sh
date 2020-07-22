#!/bin/bash

# TODO
#echo "gen readme..."
#ansible-playbook playbooks/genReadme.yml
echo "upgrading..."
lerna version patch
cp CHANGELOG.md packages/plugin-core/CHANGELOG.md
git add packages/plugin-core/CHANGELOG.md
git commit --amend --no-edit
lerna publish from-package --ignore-scripts -y
git push
