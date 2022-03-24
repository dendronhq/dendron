#!/usr/bin/env node

import { env } from "@dendronhq/common-all";
import _ from "lodash";
import yargs from "yargs";
import { PublishCLICommand } from "../src/commands";
import { DevCLICommand } from "../src/commands/devCLICommand";
import { DoctorCLICommand } from "../src/commands/doctor";
import { ExportPodCLICommand } from "../src/commands/exportPod";
import { ExportPodV2CLICommand } from "../src/commands/exportPodV2";
import { ImportPodCLICommand } from "../src/commands/importPod";
import { LaunchEngineServerCommand } from "../src/commands/launchEngineServer";
import { NoteCLICommand } from "../src/commands/notes";
import { PublishPodCLICommand } from "../src/commands/publishPod";
import { SeedCLICommand } from "../src/commands/seedCLICommand";
import { VaultCLICommand } from "../src/commands/vaultCLICommand";
import { WorkspaceCLICommand } from "../src/commands/workspaceCLICommand";
// import { WorkspaceCLICommand } from "../src/commands/workspace";

if (_.isUndefined(env("LOG_LEVEL", { shouldThrow: false }))) {
  process.env.LOG_LEVEL = "error";
}

const buildYargs = yargs;

new ExportPodCLICommand().buildCmd(buildYargs);
new LaunchEngineServerCommand().buildCmd(buildYargs);
new ImportPodCLICommand().buildCmd(buildYargs);
new PublishPodCLICommand().buildCmd(buildYargs);
new DoctorCLICommand().buildCmd(buildYargs);
new NoteCLICommand().buildCmd(buildYargs);
new VaultCLICommand().buildCmd(buildYargs);
new WorkspaceCLICommand().buildCmd(buildYargs);
new SeedCLICommand().buildCmd(buildYargs);
new DevCLICommand().buildCmd(buildYargs);
new PublishCLICommand().buildCmd(buildYargs);
new ExportPodV2CLICommand().buildCmd(buildYargs);

// eslint-disable-next-line no-unused-expressions
buildYargs.demandCommand(1).help().argv;
