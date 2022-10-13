/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */

// const path = require("path");

// const binding_path = path.resolve(path.join(__dirname, "node_sqlite3.node"));
// const binding = require(binding_path);
const binding = require("node_sqlite3.node");
console.log("Inside custom binding");

// debugger;

module.exports = exports = binding;
