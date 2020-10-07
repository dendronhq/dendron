import {
  PublishNotesCommand,
  PublishNotesCommandOpts,
} from "@dendronhq/dendron-cli";
import _ from "lodash";
import { window } from "vscode";
import { CONFIG } from "../constants";
import { VSCodeUtils } from "../utils";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = Partial<PublishNotesCommandOpts>;

type CommandOutput = void;

export class PublishCommand extends BasicCommand<CommandOpts, CommandOutput> {
  async gatherInputs(): Promise<any> {
    return {};
  }
  async execute(opts?: CommandOpts) {
    const cmd = new PublishNotesCommand();
    const wsRoot = DendronWorkspace.rootDir() as string;
    const ws = DendronWorkspace.instance();
    const vault = ws.engine.props.root;
    const publishRepoDir = DendronWorkspace.configuration().get<
      string | undefined
    >(CONFIG.PUBLISH_REPO_DIR.key);
    await cmd.eval({ wsRoot, vault, publishRepoDir, ...opts });
    this.showResponse();
  }

  async showResponse() {
    window.showInformationMessage("publish completed");
  }
}
