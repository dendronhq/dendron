#!/bin/sh

WORKSPACE=packages/dendron-11ty/fixtures/test-workspace
rsync -av $WORKSPACE . --exclude build --exclude pods