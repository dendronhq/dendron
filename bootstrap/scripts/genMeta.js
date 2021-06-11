const fs = require("fs-extra");
const path = require("path");
const {getMetaPath} = require("./utils");

async function main() {
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
    const unpublish = [];
    meta.forEach(({name, version})=> {
        out[name] = version;
        unpublish.push(`npm unpublish --force ${name}`)
    });
    fs.writeJSONSync(getMetaPath(), out);
    fs.writeFileSync("unpublish.sh", unpublish.join("\n"), {encoding: "utf-8"})
    fs.chmodSync("unpublish.sh", "700")
}

main();
