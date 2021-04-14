#!/usr/bin/env node

import { env } from "@dendronhq/common-all";
import _ from "lodash";
import yargs from "yargs";
import { BuildSiteV2CLICommand } from "../src/commands/build-site-v2";
import { DoctorCLICommand } from "../src/commands/doctor";
import { ExportPodCLICommand } from "../src/commands/exportPod";
import { ImportPodCLICommand } from "../src/commands/importPod";
import { LaunchEngineServerCommand } from "../src/commands/launchEngineServer";
import { NoteCLICommand } from "../src/commands/notes";
import { PublishPodCLICommand } from "../src/commands/publishPod";
import { VaultCLICommand } from "../src/commands/vaultCLICommand";
import { WorkspaceCLICommand } from "../src/commands/workspaceCLICommand";
// import { WorkspaceCLICommand } from "../src/commands/workspace";

if (_.isUndefined(env("LOG_LEVEL", { shouldThrow: false }))) {
  process.env.LOG_LEVEL = "error";
}

let buildYargs = yargs;

new BuildSiteV2CLICommand().buildCmd(buildYargs);
new BuildSiteV2CLICommand("buildSite").buildCmd(buildYargs);
new ExportPodCLICommand().buildCmd(buildYargs);
new LaunchEngineServerCommand().buildCmd(buildYargs);
new ImportPodCLICommand().buildCmd(buildYargs);
new PublishPodCLICommand().buildCmd(buildYargs);
new DoctorCLICommand().buildCmd(buildYargs);
// new WorkspaceCLICommand().buildCmd(buildYargs);
new NoteCLICommand().buildCmd(buildYargs);
new VaultCLICommand().buildCmd(buildYargs);
new WorkspaceCLICommand().buildCmd(buildYargs);
buildYargs.demandCommand(1).help().argv;
