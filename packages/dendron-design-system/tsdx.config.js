import image from '@rollup/plugin-image';

module.exports = {
  rollup(config) {
    config.plugins.push(image());
    return config;
  },
};
