import fs from "fs-extra";
import path from "path";
import { goUpTo } from "./filesv2";

export class NodeJSUtils {
  static getVersionFromPkg(): string {
    const pkgJSON = fs.readJSONSync(
      path.join(
        goUpTo({ base: __dirname, fname: "package.json" }),
        "package.json"
      )
    );
    return `${pkgJSON.version}`;
  }
}
