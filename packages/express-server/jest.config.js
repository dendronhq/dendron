const jestConfig = require("../../jest.config");

module.exports = {
  preset: 'ts-jest',
  testMatch: [
    "**/__tests__/**/*.ts?(x)",
    "**/?(*.)+(spec|test).ts?(x)"
  ]
};
