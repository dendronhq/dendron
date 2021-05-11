// @ts-ignore
const webpackRequire = (importPath) => {
  const module = require(importPath);
  return module;
};
module.exports = webpackRequire;
