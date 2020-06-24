
#!/usr/bin/env sh



lerna run build --parallel  --scope @dendronhq/common-all --scope @dendronhq/common-client --scope @dendronhq/common-server --scope @dendronhq/engine-server --scope dendron-plugin-core
