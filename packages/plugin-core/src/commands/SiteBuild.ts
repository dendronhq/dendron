import { BuildSiteV2CLICommandOpts } from "@dendronhq/dendron-cli";
import _ from "lodash";
import path from "path";
import { window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { DendronWorkspace, getWS } from "../workspace";
import { BasicCommand } from "./base";
import fs from "fs-extra";
import { execa } from "@dendronhq/engine-server";

type CommandOpts = Partial<BuildSiteV2CLICommandOpts>;

type CommandOutput = void;

export class SiteBuildCommand extends BasicCommand<CommandOpts, CommandOutput> {
  static key = DENDRON_COMMANDS.SITE_BUILD.key;

  async gatherInputs(): Promise<any> {
    return {};
  }

  // @ts-ignore
  async execute(opts?: CommandOpts) {
    const ws = getWS();
    // @ts-ignore
    const port = ws.port;
    const wsRoot = DendronWorkspace.wsRoot();
    // @ts-ignore
    const cmd = new BuildSiteCommandV2();
    const cwd = path.join(getWS().extensionDir, "dist", "dendron-11ty/");
    console.log(cwd);

    const siteBuildeDir = path.join(wsRoot, "site");

    if (
      !(
        fs.existsSync(siteBuildeDir) && path.join(siteBuildeDir, "node_modules")
      )
    ) {
      fs.ensureDirSync(siteBuildeDir);
      fs.writeJSONSync(path.join(siteBuildeDir, "package.json"), packageJson);
      const cmdInstall = "npm install";
      await execa.command(cmdInstall, {
        shell: true,
        cwd: siteBuildeDir,
      });
      window.showInformationMessage("finish settingup site directory");
    }

    const cmdBuild = `npx dendron-cli buildSiteV2 --wsRoot ${wsRoot} --serve --stage prod`;
    await execa.command(cmdBuild, {
      shell: true,
      cwd: siteBuildeDir,
    });
    window.showInformationMessage("finish building site");

    // process.env["ENGINE_PORT"] = _.toString(port);
    // process.env["WS_ROOT"] = wsRoot;
    // process.env["STAGE"] = stage;
    //await compile({ cwd }, { serve: opts.serve, input: "." });

    //   const cmd = new SiteBuildCommand();
    //   const wsRoot = DendronWorkspace.wsRoot() as string;
    //   const ws = DendronWorkspace.instance();
    //   const vault = ws.rootWorkspace.uri.fsPath;
    //   const SiteBuildRepoDir = ws.config.site.siteRepoDir;
    //   await cmd.eval({ wsRoot, vault, SiteBuildRepoDir, ...opts });
    this.showResponse();
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
    "@dendronhq/dendron-cli": "^0.20.1-alpha.6",
  },
};
