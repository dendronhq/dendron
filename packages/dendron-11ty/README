# Overview

dendron-11ty is a port of [dendron-jekyll](https://github.com/dendronhq/dendron-jekyll) from jekyll to eleventy.

dendron-11ty is currently a work in progress and is not meant to be used in production (and non-production) environments.

# Setup

1. clone the project

```
git clone https://github.com/dendronhq/dendron-11ty.git
yarn
```

2. install the dendron-cli

```
npm install -g @dendronhq/dendron-cli
```

3. run the dendron-cli in a workspace to start the server. the below example uses the vault from the dendron site

```sh
git clone https://github.com/dendronhq/dendron-site
cd dendron-site
LOG_DST=/tmp/server.txt LOG_LEVEL=debug dendron-cli launchEngineServer --port 3006 --wsRoot .
```

4. run eleventy with the engine options
```sh
env WS_ROOT=/Users/kevinlin/projects/dendronv2/dendron-site ENGINE_PORT=3006 STAGE=dev npx eleventy --watch --serve
```

- open `http://localhost:8080/notes/b0fe6ef7-1553-4280-bc45-a71824c2ce36.html`

# Testing New Features

Dendron 11ty comes with a sample 

In order to test with a sample workspace to test out new syntax

```sh
cd {dendron-11ty}
env LOG_LEVEL=info dendron-cli launchEngineServer --port 3008 --wsRoot fixtures/test-workspace/

env WS_ROOT={dendron-11ty}/fixtures/test-workspace/ ENGINE_PORT=3008 STAGE=dev npx eleventy  --serve
```

# Tasks
- [ ] make the arrows smaller on the nav
- [ ] migrate search functionality 
    - [x] build search data
    - [ ] integrate search js fields
- [x] load notes based on dynamic pages
- [x] render dendron specific markdown 
- [ ] restrict published notes based on dendron site configuration
