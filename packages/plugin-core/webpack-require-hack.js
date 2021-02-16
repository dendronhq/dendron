const importEleventy = (importPath) => {
    const eleventy = require(importPath);
    return eleventy;
};
module.exports = importEleventy;