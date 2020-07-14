# Contributing to Dendron

Thanks for your interest in contributing to Dendron! ❤️

This document describes how to set up a development environment and submit your contributions. Please read it carefully and let us know if it's not up-to-date (even better, submit a PR with your corrections ;-)).

## Getting Started

Before you begin, you need to make sure to have the following SDKs and tools:

- [Node.js >= 12.0.0](https://nodejs.org/download/release/latest-v10.x/)
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
npx lerna run build --scope @dendronhq/engine-server 
npx lerna run build --scope @dendronhq/plugin-core
```

## Developing

- to continuously compile all dependencies
```sh
npx lerna run watch --parallel --scope @dendronhq/common-all --scope @dendronhq/common-server --scope @dendronhq/engine-server --scope @dendronhq/plugin-core
```

## Debugging 

- run extension
  - launch the `Run Extnesion` build task (copied below for reference)
```json
    {
      "name": "Run Extension",
      "type": "extensionHost",
      "request": "launch",
      "runtimeExecutable": "${execPath}",
      "args": [
        // "--disable-extensions",
        "--extensionDevelopmentPath=${workspaceFolder}"
      ],
      "outFiles": [
        "${workspaceFolder}/out/**/*.js"
      ],
      "env": {
        "STAGE": "dev",
        "VSCODE_DEBUGGING_EXTENSION": "dendron"
      }
      //"preLaunchTask": "npm: watch no
    },
```

## Testing

- in the root of the monorepo, run `./scripts/testAll.sh`

