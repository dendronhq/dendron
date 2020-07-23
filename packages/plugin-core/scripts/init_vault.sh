#!/bin/bash

mkdir build
cd build && git clone git@github.com:dendronhq/dendron-template.git
cp -R dendron-template/vault ../assets/notes/vault 