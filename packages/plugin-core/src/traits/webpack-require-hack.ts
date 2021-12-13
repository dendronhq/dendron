/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
// @ts-ignore
const webpackRequire = (importPath) => {
  const module = require(importPath);
  return module;
};
module.exports = webpackRequire;
