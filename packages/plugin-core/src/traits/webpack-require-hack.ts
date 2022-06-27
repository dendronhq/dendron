/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */

import { Logger } from "../logger";

// @ts-ignore
const webpackRequire = (importPath) => {
  // First delete the import from the node module cache in case it exists. This
  // allows us to do 'hot-reloading' of the .js files in Traits.

  const logger = Logger;

  logger.info(
    ` ---------- Inside webpack-require-hack. Import Path: ${importPath}  ----------`
  );
  const res = require.resolve(importPath);

  if (res) {
    logger.info(`${importPath} found in require.resolve`);
    const foo = require.cache[res];
    if (foo) {
      logger.info(`Found in require.cache[]: ${res}`);
      logger.info(` - filename: ${foo.filename}`);
      logger.info(` - id: ${foo.id}`);
      logger.info(` - loaded: ${foo.loaded}`);
    } else {
      logger.info(`Not in require.cache[]: ${res}`);
    }
  } else {
    logger.info(`${importPath} not found in require.resolve`);
  }

  delete require.cache[require.resolve(importPath)];
  logger.info(
    ` ---------- Inside webpack-require-hack. Post Delete  ----------`
  );

  const resTwo = require.resolve(importPath);

  if (resTwo) {
    logger.info(`${importPath} found in require.resolve`);
    const foo = require.cache[resTwo];

    if (foo) {
      logger.info(`Found in require.cache[]: ${resTwo}`);
      logger.info(` - filename: ${foo.filename}`);
      logger.info(` - id: ${foo.id}`);
      logger.info(` - loaded: ${foo.loaded}`);
    } else {
      logger.info(`Not in require.cache[]: ${resTwo}`);
    }
  } else {
    logger.info(`${importPath} not found in require.resolve`);
  }

  const module = require(importPath);
  logger.info(
    ` ---------- Inside webpack-require-hack. Post Require ----------`
  );
  const resThree = require.resolve(importPath);

  if (resThree) {
    logger.info(`${importPath} found in require.resolve`);
    const foo = require.cache[resThree];

    if (foo) {
      logger.info(`Found in require.cache[]: ${resThree}`);
      logger.info(` - filename: ${foo.filename}`);
      logger.info(` - id: ${foo.id}`);
      logger.info(` - loaded: ${foo.loaded}`);
    } else {
      logger.info(`Not in require.cache[]: ${resThree}`);
    }
  } else {
    logger.info(`${importPath} not found in require.resolve`);
  }

  logger.info(`Inside webpack-require-hack. End`);
  return module;
};
module.exports = webpackRequire;
