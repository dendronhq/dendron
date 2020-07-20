#!/bin/bash

# TODO
#echo "gen readme..."
#ansible-playbook playbooks/genReadme.yml
echo "upgrading..."
lerna version patch
lerna publish from-package --ignore-scripts -y
git push
