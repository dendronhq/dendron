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
 * Copy ant theme styles
 */
const fetchBaseStyles = (dst) => {
	const themes = ["light", "dark"];
	const nextRoot = path.join("..", "dendron-next-server", "public");
	themes.map(th => {
		fs.copyFileSync(path.join(nextRoot, `${th}-theme.css`), path.join(dst, `${th}.css`));
	});
};


/**
 * Copy scss styles from dendron-next-server
 * This is all Dendron customizations
 * - how blockquotes are rendered
 * - table borders
 * - etc
 */
const fetchCustomStyles = (dst) => {
	const nextRoot = path.join("..", "dendron-next-server", "styles", "scss");
	fs.copySync(nextRoot, dst);
};

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
		// write to build
		fs.writeFileSync(path.join(dest, `${k}.css`), themeContentString);
	});
}

const buildAll = async () => {
	const cssRoot = path.join("assets", "css");
	const dstRoots =[
		// required for browser mode
		path.join("public", "static", "css", "themes"),
		// required when exporting to plugin-core
		// path.join("build", "static", "css", "themes"),
	]

	// --- Fetch
	// We re-use style sheets from other packages, this fetches them all
	// into this package
	console.log("fetching...");
	// these are the main style. ant.d styles 
	fetchBaseStyles(path.join(cssRoot, "main"));

	// these are our custom styles
	// NOTE: we copy styles directly into the `src/` directory because 
	// it gets imported in the `DendronAppComponent`
	fetchCustomStyles(path.join("src", "styles", "scss"))

	// --- Read
	// Read all stylesheets and builds theme map
	console.log("reading...");
	const mainThemeMap = filesToThemeMap(path.join(cssRoot, "main"));
	const prismThemeMap = filesToThemeMap(path.join(cssRoot, "prism"));

	// --- Compile
	// Concat and writes all styling into final style sheets
	console.log("compile...");
	const themeMaps = concatStyles([mainThemeMap, prismThemeMap]);
	await Promise.all(dstRoots.map(async dstRoot => {
		fs.ensureDirSync(dstRoot);
		writeStyles({themeMaps, dest: dstRoot})
	}));

	console.log("done");
};

buildAll();
