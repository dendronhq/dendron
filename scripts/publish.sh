#!/bin/bash

lerna version patch -y
lerna publish from-package --ignore-scripts -y
git push
