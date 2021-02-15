const { Liquid } = require('liquidjs');

module.exports = (() => {
  const liquidParser = new Liquid({
    root: ['_includes'],
    extname: '.liquid',
    dynamicPartials: false,
    strictFilters: true,
  });

  return liquidParser;
})();
