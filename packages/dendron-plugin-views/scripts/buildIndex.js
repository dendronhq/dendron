const { WebViewCommonUtils } = require("@dendronhq/common-server");
const fs = require("fs-extra");
const path = require("path");

// Compile Dendron `index.html` template
let theme = process.env.THEME || "light";

const out = WebViewCommonUtils.genVSCodeHTMLIndex({
  // dummy, not used. for browser mode, this is added by CRA app
  jsSrc: "",
  cssSrc: "",
  // cssSrc: `${path.join("public", "static", "css", theme + ".css")}`,
  port: 3005,
  wsRoot: path.resolve(path.join("..", "..", "test-workspace")),
  browser: true,
  acquireVsCodeApi: `window.vscode = {postMessage: ()=>{}};`,
  themeMap: {
    light: `${"/" + path.join("static", "css", "themes", "light.css")}`,
    dark: `${"/" + path.join("static", "css", "themes", "dark.css")}`,
  },
  initialTheme: theme,
});
console.log("building index", { theme });
fs.writeFileSync(path.join("public/index.html"), out);
