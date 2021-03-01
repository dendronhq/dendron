const {generateChangelog} = require("@dendronhq/engine-server")

// return changelog to render inside the template

// commitsWithChanges =
// [
//     {
//         commit: "...",
//         date: "..."
//     },
//     {
//         commit: "...",
//         date: "...",
//         diff: [
//             {
//                 fname: "",
//                 diff: [],
//             }
//         ]
//     }
// ]

// only generate last changelog, save everything else on disk

async function getChangelog() {
  let changedFiles = generateChangelog(process.env.WS_ROOT)
  return changedFiles
}

module.exports = async function () {
    return getChangelog()
}
