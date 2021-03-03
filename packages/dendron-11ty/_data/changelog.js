const {generateChangelog} = require("@dendronhq/engine-server")
const fs = require("fs-extra");

async function getChangelog() {
  const changes = fs.readJSONSync("/tmp/changes.json");
  console.log(changes, "changes")
  return changes
}

module.exports = async function () {
    return getChangelog()
}
