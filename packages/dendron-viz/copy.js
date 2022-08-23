const fs = require("fs");
const path = require("path");

const modulePath = path.join("src", "loadModule.js");
fs.copyFile(modulePath, path.join("lib", "loadModule.js"), (error) => {
	if (error) {
		throw error
	}
})
