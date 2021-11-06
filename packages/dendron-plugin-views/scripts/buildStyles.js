const fs = require("fs-extra");
const path = require("path");
const _ = require("lodash");



const filesToThemeMap = (root) => {
	const dir = fs.readdirSync(root);
	const out = {};
	dir.map(ent=> {
		out[path.basename(ent, ".css")] = path.join(root, ent);
	});
	return out;
}

/**
 * Concatenates themes 
 * @param {*} themeMaps 
 * @returns 
 */
const concatStyles = (themeMaps) => {
	const finalOutput = {
		light: [],
		dark: [],
	};
	themeMaps.map(themeMap => {
		console.log(themeMap);
		const keys = ["light", "dark"];
		keys.map(k => {
			const themeContents = fs.readFileSync(themeMap[k], {encoding: "utf-8"});
			finalOutput[k].push(themeContents)
		});
	});
	return finalOutput;
}

const writeStyles = ({themeMaps, dest}) => {
	_.map(themeMaps, (v, k) => {
		const themeContentString = v.join("\n");
		fs.writeFileSync(path.join(dest, `${k}.css`), themeContentString);
	});
}

const buildAll = () => {
	const cssRoot = path.join("assets", "css");
	const dstRoot = path.join("build", "static", "css", "themes");
	const mainThemeMap = filesToThemeMap(path.join(cssRoot, "main"));
	const prismThemeMap = filesToThemeMap(path.join(cssRoot, "prism"));
	const themeMaps = concatStyles([mainThemeMap, prismThemeMap]);
	fs.ensureDirSync(dstRoot);
	writeStyles({themeMaps, dest: dstRoot})
};

buildAll();
