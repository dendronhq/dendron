const fs = require("fs-extra");
const path = require("path");
const _ = require("lodash");

const filesToThemeMap = (root) => {
  console.log(`reading ${root}`);
  const dir = fs.readdirSync(root);
  const out = {};
  dir.forEach((ent) => {
    out[path.basename(ent, ".css")] = path.join(root, ent);
  });
  return out;
};

const concatStyles = (themeMaps) => {
  const finalOutput = {
    light: [],
    dark: [],
  };
  themeMaps.forEach((themeMap) => {
    const keys = ["light", "dark"];
    keys.forEach((k) => {
      const themeContents = fs.readFileSync(themeMap[k], { encoding: "utf-8" });
      finalOutput[k].push(themeContents);
    });
  });
  return finalOutput;
};

const writeStyles = ({ themeMaps, dest, common }) => {
  _.map(themeMaps, (v, k) => {
    const themeContentString = v.concat(common).join("\n");
    // write to build
    fs.writeFileSync(path.join(dest, `${k}.css`), themeContentString);
  });
};

const copyContents = async ({ from, to }) => {
  const contents = await fs.readdir(from);
  await Promise.all(
    contents.map(async (file) => {
      await fs.copyFile(path.join(from, file), path.join(to, file));
    })
  );
};

const buildAll = async () => {
  const cssRoot = path.join("assets", "css");
  // everything that belongs to the top of the directory
  const topRoot = path.join("assets", "top");
  const katexFontsRoot = path.join("assets", "katex-fonts");

  const dstCssRoot = path.join("build", "assets", "css");
  const dstRoots = [path.join("build", "assets", "css")];

  // --- Read
  // Read all stylesheets and builds theme map
  console.log("reading all styles...");
  const antdThemes = filesToThemeMap(path.join(cssRoot, "antd"));
  const prismThemes = filesToThemeMap(path.join(cssRoot, "prism"));
  const katex = fs.readFileSync(path.join(cssRoot, "katex.min.css"), {
    encoding: "utf-8",
  });
  const fontello = fs.readFileSync(
    path.join("assets", "fontello", "css", "fontello.css"),
    {
      encoding: "utf-8",
    }
  );

  // --- Compile
  // Concat and writes all styling into final style sheets
  console.log("compiling styles...");
  const themeMaps = concatStyles([antdThemes, prismThemes]);
  await Promise.all(
    dstRoots.map(async (dstRoot) => {
      fs.ensureDirSync(dstRoot);
      fs.emptyDirSync(dstRoot);
      writeStyles({ themeMaps, common: [fontello, katex], dest: dstRoot });
    })
  );

  const fontsTarget = path.join(dstCssRoot, "fonts");
  // --- Other
  // katex fonts need to be referenced in css
  fs.copySync(katexFontsRoot, fontsTarget);
  // add favicon
  fs.copySync(topRoot, path.join("build", "top"));
  // Fontello, used for icons
  const fontelloFonts = path.join("assets", "fontello", "font");
  await copyContents({ from: fontelloFonts, to: fontsTarget });
};
buildAll();
