#!/bin/bash

# TODO
#echo "gen readme..."
#ansible-playbook playbooks/genReadme.yml
echo "upgrading..."
lerna version patch -y
lerna publish from-package --ignore-scripts -y
git push
