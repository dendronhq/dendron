import {
  PublishNotesCommand,
  PublishNotesCommandOpts,
} from "@dendronhq/dendron-cli";
import { window } from "vscode";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = Partial<PublishNotesCommandOpts>;

type CommandOutput = void;

export class PublishCommand extends BasicCommand<CommandOpts, CommandOutput> {
  async gatherInputs(): Promise<any> {
    return {};
  }
  async execute(opts?: CommandOpts) {
    const engineClient = DendronWorkspace.instance().getEngine();
    opts = { ...opts, engineClient };
    const cmd = new PublishNotesCommand();
    const wsRoot = DendronWorkspace.rootDir() as string;
    const ws = DendronWorkspace.instance();
    const vault = ws.rootWorkspace.uri.fsPath;
    const publishRepoDir = ws.config.site.siteRepoDir;
    await cmd.eval({ wsRoot, vault, publishRepoDir, ...opts });
    this.showResponse();
  }

  async showResponse() {
    window.showInformationMessage("publish completed");
  }
}
