/* eslint-disable no-multi-assign */
/* eslint-disable import/no-dynamic-require */

/**
 * This is an override for the native module binding in the sqlite3 package. It
 * is only used for webpack bundled versions of Dendron Local ext. This binding
 * override is necessary because the native node module in the sqlite3 package
 * cannot be resolved through webpack without some workarounds.
 */
const path = require("path");

const bindingPath = path.resolve(path.join(__dirname, "node_sqlite3.node"));
const binding = require(bindingPath);

module.exports = exports = binding;
