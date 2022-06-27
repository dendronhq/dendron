const webpackRequire = (importPath) => {
  delete require.cache[require.resolve(importPath)];
  const module = require(importPath);
  return module;
};
module.exports = webpackRequire;
