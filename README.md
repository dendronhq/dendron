
# Dev

### Build Code Plugin
- order matters

```sh
lerna run build --scope @dendronhq/common-all
lerna run build --parallel  --scope @dendronhq/common-server 
--scope @dendronhq/plugin-core
lerna run build --parallel  --scope @dendronhq/common-client --scope @dendronhq/common-server --scope @dendronhq/plugin-core
```

# Issues

### Build issues
- [] delete lock files
- [] missing global dep (eg. `rimraf`)