const fs = require("fs-extra");

async function getChangelog() {
  const changes = fs.readJSONSync("/tmp/changes.json");
  return changes.commits
}

module.exports = function () {
    return getChangelog()
}
