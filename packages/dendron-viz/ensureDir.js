const fs = require("fs");

// directory to check if exists
const dir = "lib";

// check if directory exists
if (!fs.existsSync(dir)) {
  fs.mkdir(dir, { recursive: true }, (error) => {
    if (error) {
      throw error;
    }
  });
}
