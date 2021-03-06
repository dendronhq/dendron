const fs = require("fs-extra");
const {env} = require("../libs/utils")

async function getChangelog() {
  const changes = fs.readJSONSync(env().wsRoot + "/build/changes.json");
  // return []
  return changes.commits
}

module.exports = function () {
    return getChangelog()
}
