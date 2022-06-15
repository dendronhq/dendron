/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
// @ts-ignore
const webpackRequire = (importPath) => {
  // First delete the import from the node module cache in case it exists. This
  // allows us to do 'hot-reloading' of the .js files in Traits.
  delete require.cache[require.resolve(importPath)];

  const module = require(importPath);
  return module;
};
module.exports = webpackRequire;
