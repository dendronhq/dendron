const jestConfig = require("../../jest.config");

module.exports = {
  ...jestConfig,
  testEnvironment: "jsdom",
};
