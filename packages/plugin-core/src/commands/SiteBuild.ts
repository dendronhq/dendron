import { BuildSiteV2CLICommandOpts } from "@dendronhq/dendron-cli";
import { execa } from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = Partial<BuildSiteV2CLICommandOpts>;

type CommandOutput = void;
type NPMDep = { pkg: string; version: string };

export class SiteBuildCommand extends BasicCommand<CommandOpts, CommandOutput> {
  static key = DENDRON_COMMANDS.SITE_BUILD.key;

  async gatherInputs(): Promise<any> {
    return {};
  }

  async execute(_opts?: CommandOpts) {
    const ctx = "SiteBuildCommand";
    try {
      const resp = await this.checkPreReq();
      if (_.isUndefined(resp)) {
        window.showInformationMessage("Cancelled");
        return;
      }
    } catch (err) {
      this.L.error({
        ctx,
        msg: "error when checking site pre-requisites",
        err,
      });
    }

    const wsRoot = DendronWorkspace.wsRoot();
    window.showInformationMessage("building...");
    const port = DendronWorkspace.instance().port!;
    // TODO: show progress
    const cmdBuild = `npx dendron-cli buildSiteV2 --wsRoot ${wsRoot} --stage prod --enginePort ${port}`;
    await execa.command(cmdBuild, {
      shell: true,
      cwd: wsRoot,
    });
    window.showInformationMessage("finish building site");
  }

  // runWithoutShell() {
  //   const port = DendronWorkspace.instance().port!;
  //   const cmd = new BuildSiteV2CLICommand();
  //   const ws = getWS();
  //   const engine = ws.getEngine();
  //   const cwd = "/Users/kevinlin/projects/dendronv2/dendron-11ty";
  //   //this.L.info({ctx, cwd, ws, port});
  //   await cmd.execute({engine, wsRoot, serve: false, stage: "prod", cwd, enginePort: port})

  // }

  pkgCreate(pkgPath: string) {
    return fs.writeJSONSync(pkgPath, packageJson);
  }

  async pkgInstall() {
    const cmdInstall = "npm install";
    await execa.command(cmdInstall, {
      shell: true,
      cwd: DendronWorkspace.wsRoot(),
    });
  }

  async pkgUpgrade(pkg: string, version: string) {
    const cmdInstall = `npm install --save ${pkg}${_.replace(
      version,
      "^",
      "@"
    )}`;
    await execa.command(cmdInstall, {
      shell: true,
      cwd: DendronWorkspace.wsRoot(),
    });
  }

  async checkPreReq() {
    // check for package.json
    const pkgPath = path.join(DendronWorkspace.wsRoot(), "package.json");
    if (!fs.existsSync(pkgPath)) {
      window.showInformationMessage("no package.json. creating package.json");
      this.pkgCreate(pkgPath);
      window.showInformationMessage("created package.json");
      const resp = await window.showInformationMessage(
        "install dependencies from package.json?",
        "Install",
        "Cancel"
      );
      if (resp !== "Install") {
        return undefined;
      }
      window.showInformationMessage("installing dependencies...");
      // TODO: show progress
      await this.pkgInstall();
    } else {
      // check dependencies
      const pkgContents = fs.readJSONSync(pkgPath);
      const pkgDeps = pkgContents.dependencies;
      const outOfDate: NPMDep[] = _.filter<NPMDep | undefined>(
        _.map(packageJson.dependencies, (v, k) => {
          if (pkgDeps[k] !== v) {
            return { pkg: k, version: v };
          }
          return undefined;
        }),
        (ent) => !_.isUndefined(ent)
      ) as NPMDep[];
      if (!_.isEmpty(outOfDate)) {
        const resp = await window.showInformationMessage(
          "Dependencies are out of date",
          "Update",
          "Cancel"
        );
        if (resp !== "Update") {
          return undefined;
        }
        await _.reduce(
          outOfDate,
          async (prev, opts) => {
            await prev;
            let { pkg, version } = opts;
            return this.pkgUpgrade(pkg, version);
          },
          Promise.resolve()
        );
      } else {
        return true;
        // check NODE_MODULES TODO
      }
    }
    return true;
    // check for node_modules
    // check latest versions
  }

  async showResponse() {
    window.showInformationMessage("SiteBuild completed");
  }
}

const packageJson = {
  name: "dendron-site",
  version: "1.0.0",
  main: "index.js",
  license: "MIT",
  dependencies: {
    "@dendronhq/dendron-11ty": "^1.22.1",
    "@dendronhq/dendron-cli": "^0.22.1-alpha.1",
  },
};
