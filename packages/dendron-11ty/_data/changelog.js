const {generateChangelog} = require("@dendronhq/engine-server")
const fs = require("fs-extra");

// return changelog to render inside the template

async function getChangelog() {
  // let changes = generateChangelog(process.env.WS_ROOT)
  // fs.readJSONSync(path.join(__dirname, "changelog-changes.json"))
  // console.log(changes, "changes")
  let changes = [{}]
  return changes
}

module.exports = async function () {
    return getChangelog()
}
