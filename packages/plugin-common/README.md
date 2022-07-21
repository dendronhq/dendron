## Package Description

This package is meant to be for common code between local, web, and remote [extension hosts](https://code.visualstudio.com/api/advanced-topics/extension-host) for the Dendron plugin.

Code that IS ok to import in this package:

- common-all
- VS Code API's
- any node packages that work in both browser and node environments.

Code that is NOT ok to import in this package:

- plugin-core
- common-server
- engine-server
- any node packages that do not support browser or node, including fs, fs-extra
