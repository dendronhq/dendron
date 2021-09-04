import _ from "lodash";
import path from "path";
import { window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { Logger } from "../logger";
import { getExtension } from "../workspace";
import { BasicCommand } from "./base";

const L = Logger;

type CommandOpts = {};

export class AddAndCommit extends BasicCommand<CommandOpts, void> {
  key = DENDRON_COMMANDS.ADD_AND_COMMIT.key;

  async execute(opts?: CommandOpts) {
    const ctx = "execute";
    L.info({ ctx, opts });
    const resp = await getExtension().workspaceService!.commitAndAddAll();
    if (_.isEmpty(resp)) {
      window.showInformationMessage(`no files to add or commit`);
      return;
    }
    const respString = _.map(resp, (ent: string) => {
      return path.basename(ent);
    })
      .filter((ent) => !_.isUndefined(ent))
      .join(", ");
    window.showInformationMessage(
      `add and commit files in the following vaults: ${respString}`
    );
    return;
  }
}
