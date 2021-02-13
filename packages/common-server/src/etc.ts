import fs from "fs-extra";
import path from "path";
import { goUpTo } from "./filesv2";

export class NodeJSUtils {
  static getVersionFromPkg(): string {
    const pkgJSON = fs.readJSONSync(
      path.join(goUpTo(__dirname), "package.json")
    );
    return `${pkgJSON.version}`;
  }
}
