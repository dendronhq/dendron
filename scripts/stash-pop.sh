#!/usr/bin/env bash

git stash && git stash pop stash@{1} && git read-tree stash && git stash drop
