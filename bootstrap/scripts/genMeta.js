const fs = require("fs-extra");
const path = require("path");

async function main() {
  const PROJ_ROOT = path.join(__dirname, "..", "..");
  const PKG_ROOT = path.join(__dirname, "..", "..", "packages");
  const projects = fs.readdirSync(PKG_ROOT);
  const exclude = [".DS_Store"];
  const meta = await Promise.all(projects
    .filter((ent) => !exclude.includes(ent))
    .map(async (ent) => {
      const pkgPath = path.join(PKG_ROOT, ent, "package.json");
      console.log(pkgPath);
      const { name, version } = await fs.readJSON(pkgPath);
      return { name, version };
    }));
    const out = {};
    meta.forEach(({name, version})=> {
        out[name] = version;
    });
    fs.writeJSONSync(path.join(PROJ_ROOT, "meta.json"), out);
}

main();
