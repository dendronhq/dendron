const jestConfig = require("../../jest.config");

module.exports = {
  ...jestConfig,
  testEnvironment: "jest-environment-jsdom-sixteen",
};
