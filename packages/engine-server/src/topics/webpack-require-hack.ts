// @ts-ignore
// NOTE: This file is ONLY used during debugging. In the webpacked production
// build, the file that is used is the version located at
// PROJECT_ROOT/packages/plugin-core/webpack-require-hack.js
const webpackRequire = (importPath) => {
  // First delete the import from the node module cache in case it exists. This
  // allows us to do 'hot-reloading' of the .js files in Traits.
  delete require.cache[require.resolve(importPath)];
  const module = require(importPath);
  return module;
};
module.exports = webpackRequire;
