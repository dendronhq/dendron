const fs = require("fs-extra");
const {env} = require("../libs/utils")

async function getChangelog() {
  const changePath = env().wsRoot + "/build/changes.json";
  if (!fs.existsSync(changePath)) {
    return [];
  }
  const changes = fs.readJSONSync(env().wsRoot + "/build/changes.json");
  if (changes.commits.length > 0) {
    return changes.commits
  }
  return []
}

module.exports = function () {
    return getChangelog()
}
