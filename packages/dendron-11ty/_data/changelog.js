const fs = require("fs-extra");

async function getChangelog() {
  const changes = fs.readJSONSync("/tmp/changes.json");
  console.log(changes.commits, "commits")
  // let changes = []
  return changes.commits
}

module.exports = function () {
    return getChangelog()
}
