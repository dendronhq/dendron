const fs = require("fs-extra");

async function getChangelog() {
  const changes = fs.readJSONSync("/tmp/changes.json");
  return [changes]
}

module.exports = function () {
    return getChangelog()
}
