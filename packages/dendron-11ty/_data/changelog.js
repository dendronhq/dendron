const fs = require("fs-extra");

async function getChangelog() {
  return fs.readJSONSync("/tmp/changes.json");
}

module.exports = async function () {
    return getChangelog()
}
