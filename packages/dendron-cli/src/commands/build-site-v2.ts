import { DEngineClient, Stage } from "@dendronhq/common-all";
import { goUpTo } from "@dendronhq/common-server";
import { generateChangelog, SiteUtils } from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import yargs from "yargs";
import { CLICommand } from "./base";
import { setupEngine, setupEngineArgs } from "./utils";

type CommandCLIOpts = {
  wsRoot: string;
  port?: number;
  engine?: DEngineClient;
  cwd?: string;
  servePort?: number;
  enginePort?: number;
  serve: boolean;
  stage: Stage;
  output?: string;
  custom11tyPath?: string;
};
type CommandOpts = CommandCLIOpts & {
  engine: DEngineClient;
  compile?: any;
  server: any;
  eleventy?: any;
};
type CommandOutput = {};

export { CommandOpts as BuildSiteV2CLICommandOpts };
export { CommandCLIOpts as BuildSiteV2CLICommandCliOpts };

export class BuildSiteV2CLICommand extends CLICommand<
  CommandOpts,
  CommandOutput
> {
  constructor(name?: string) {
    super({
      name: name || "buildSiteV2",
      desc: "build notes for publication using 11ty",
    });
  }

  buildArgs(args: yargs.Argv) {
    super.buildArgs(args);
    setupEngineArgs(args);
    args.option("serve", {
      describe: "serve over local http server",
      default: false,
      type: "boolean",
    });
    args.option("stage", {
      describe: "serve over local http server",
      default: "dev",
      choices: ["dev", "prod"],
    });
    args.option("output", {
      describe: "if set, override output from config.yml",
      type: "string",
    });
    args.option("custom11tyPath", {
      describe: "if set, path to custom 11ty installation",
      type: "string",
    });
  }

  async enrichArgs(args: CommandCLIOpts): Promise<CommandOpts> {
    const engineArgs = await setupEngine(args);
    this.L.info({ msg: `connecting to engine on port: ${engineArgs.port}` });
    // add site specific notes
    if (args.enginePort) {
      const siteNotes = SiteUtils.addSiteOnlyNotes({
        engine: engineArgs.engine,
      });
      _.forEach(siteNotes, (ent) => {
        engineArgs.engine.notes[ent.id] = ent;
      });
    }
    return { ...args, ...engineArgs };
  }

  async execute(opts: CommandOpts) {
    const{ wsRoot, port, stage, output, server, engine } = _.defaults(opts);
    let cwd = opts.cwd;
    if (!cwd) {
      // need to be inside
      let nmPath = goUpTo({ base: __dirname, fname: "node_modules" });
      cwd = path.join(nmPath, "node_modules", "@dendronhq", "dendron-11ty");
      // fix for /home/runner/work/dendron-site/dendron-site/node_modules/@dendronhq/dendron-cli/node_modules/@dendronhq/dendron-11ty'
      if (!fs.existsSync(cwd)) {
        nmPath = goUpTo({
          base: path.join(nmPath, ".."),
          fname: "node_modules",
        });
        cwd = path.join(nmPath, "node_modules", "@dendronhq", "dendron-11ty");
      }
    }
    process.env["ENGINE_PORT"] = _.toString(port);
    process.env["WS_ROOT"] = wsRoot;
    process.env["BUILD_STAGE"] = stage;
    if (output) {
      process.env["OUTPUT"] = output;
    }
    let compile;
    let buildNav;
    let copyAssets;
    let buildStyles;
    let buildSearch;
    let getEngine;
    if (opts.eleventy) {
      ({ compile, buildNav, copyAssets, buildStyles, buildSearch, getEngine } =
        opts.eleventy);
    } else {
      if (opts.custom11tyPath) {
        ({
          compile,
          buildNav,
          copyAssets,
          buildStyles,
          buildSearch,
          getEngine,
        } = require(opts.custom11tyPath));
      } else {
        ({
          compile,
          buildNav,
          copyAssets,
          buildStyles,
          buildSearch,
          getEngine,
        } = require("@dendronhq/dendron-11ty"));
      }
    }
    // introduced in version 0.41
    if (getEngine) {
      // force re-initialization
      await getEngine(true);
    }
    this.L.info("running pre-compile");
    await Promise.all([buildNav(), copyAssets()]);
    if (engine.config.site.generateChangelog) {
      await generateChangelog(opts.engine);
    }
    this.L.info("running compile");
    await compile(
      { cwd },
      { serve: opts.serve, port: engine.config.site.previewPort || 8080 }
    );
    this.L.info("running post-compile");
    await Promise.all([buildStyles(), buildSearch()]);
    if (!opts.serve) {
      this.L.info({ msg: "done compiling" });
      setTimeout(() => {
        server.close((err: any) => {
          this.L.info({ msg: "closing server" });
          if (err) {
            this.L.error({ msg: "error closing", payload: err });
          }
        });
      }, 5000);
    }
    return {};
  }
}
