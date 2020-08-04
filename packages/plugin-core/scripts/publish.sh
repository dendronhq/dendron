#!/bin/bash

vsce publish
export OVSX_PAT=`cat ../../../OVSX_PAT`
ovsx publish
