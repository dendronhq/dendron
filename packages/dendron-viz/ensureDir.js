const fs = require("fs");
const path = require("path");

// directory to check if exists
const dir = "lib";

// check if directory exists
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(
    path.join(__dirname, "src", "loadModule.js"),
    path.join(__dirname, "lib", "loadModule.js")
  );
}
