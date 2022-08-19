#!/usr/bin/env bash

# Generates line count statistics for the repo
commit=$(git rev-list HEAD --max-count=1) 
cloc --vcs=git . | tee reports/$commit
