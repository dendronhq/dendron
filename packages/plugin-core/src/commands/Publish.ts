import {
  PublishNotesCommand,
  PublishNotesCommandOpts,
} from "@dendronhq/dendron-cli";
import { window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = Partial<PublishNotesCommandOpts>;

type CommandOutput = void;

export class PublishCommand extends BasicCommand<CommandOpts, CommandOutput> {
  static key = DENDRON_COMMANDS.PUBLISH.key;
  async gatherInputs(): Promise<any> {
    return {};
  }
  async execute(opts?: CommandOpts) {
    const engineClient = DendronWorkspace.instance().getEngine();
    opts = { ...opts, engineClient };
    const cmd = new PublishNotesCommand();
    const wsRoot = DendronWorkspace.wsRoot() as string;
    const ws = DendronWorkspace.instance();
    const vault = ws.vaultsv4[0];
    const publishRepoDir = ws.config.site.siteRepoDir;
    await cmd.eval({ wsRoot, vault, publishRepoDir, ...opts });
    this.showResponse();
  }

  async showResponse() {
    window.showInformationMessage("publish completed");
  }
}
