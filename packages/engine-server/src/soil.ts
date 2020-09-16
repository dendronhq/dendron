import { createLogger, DEngine } from "@dendronhq/common-all";
import { Logger } from "@dendronhq/common-server";
import _ from "lodash";
import path from "path";
import { DendronEngine } from "./engine";
import fs from "fs-extra";

type DendronSoilOpts = {
  name: string;
  wsRoot: string;
  engine?: DEngine;
  roots: string[];
};

export abstract class DendronSoil {
  public opts: DendronSoilOpts;
  public L: Logger;
  public engine: DEngine;

  buildDirPath(customDir?: string): string {
    const root = this.opts.wsRoot;
    let buildDirComp = [root, "build"];
    if (customDir) {
      buildDirComp.push(customDir);
    }
    const buildDirPath = path.join(...buildDirComp);
    fs.ensureDirSync(buildDirPath);
    return buildDirPath;
  }

  constructor(opts: DendronSoilOpts) {
    this.opts = opts;
    //@ts-ignore
    this.L = createLogger(opts.name);
    if (!_.isUndefined(this.opts.engine)) {
      this.engine = this.opts.engine;
    } else {
      this.engine = DendronEngine.getOrCreateEngine({
        root: this.opts.roots[0],
        forceNew: true,
      });
    }
  }
}
