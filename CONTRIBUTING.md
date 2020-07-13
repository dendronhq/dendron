# Contributing to Dendron

Thanks for your interest in contributing to Dendron! ❤️

This document describes how to set up a development environment and submit your contributions. Please read it carefully and let us know if it's not up-to-date (even better, submit a PR with your corrections ;-)).

## Getting Started

Before you begin, you need to make sure to have the following SDKs and tools:

- [Node.js >= 10.13.0](https://nodejs.org/download/release/latest-v10.x/)
  - We recommend using a version in [Active LTS](https://nodejs.org/en/about/releases/)

The basic commands to get the repository cloned and built locally follow:

```console
git clone https://github.com/dendronhq/dendron.git 
cd dendron
npm install
```
## Build Code Plugin

- bootstrap dependencies
```sh
npx lerna bootstrap --scope @dendronhq/common-all  --scope @dendronhq/common-server --scope @dendronhq/engine-server --scope @dendronhq/plugin-core

```

- build dependencies
```sh
npx lerna run build --scope @dendronhq/common-all
npx lerna run build --scope @dendronhq/common-server 
lerna run build --scope @dendronhq/engine-server 
lerna run build --scope @dendronhq/plugin-core

npx lerna run build --parallel  --scope @dendronhq/common-client --scope @dendronhq/common-server --scope @dendronhq/plugin-core
```

# Issues

### Build issues
- [] delete lock files
- [] missing global dep (eg. `rimraf`)