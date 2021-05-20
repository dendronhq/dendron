#!/bin/sh

LOG_LEVEL=error dendron-cli buildSiteV2 --wsRoot .  --stage dev --serve

#| tee /tmp/out.txt
