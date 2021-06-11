const path = require("path");

function getProjRoot() {
    return path.join(__dirname, "..", "..");
}

function getMetaPath() {
    return path.join(getProjRoot(), "meta.json");
}

module.exports = {
    getMetaPath,
    getProjRoot
}