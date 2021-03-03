const {generateChangelog} = require("@dendronhq/engine-server")

// return changelog to render inside the template

async function getChangelog() {
  let changes = generateChangelog(process.env.WS_ROOT)
  console.log(changes, "changes")
  return changes
}

module.exports = async function () {
    return getChangelog()
}
