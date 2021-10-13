import { DVault, VaultRemoteSource } from "@dendronhq/common-all";
import _ from "lodash";
import { DENDRON_COMMANDS } from "../constants";
import { BasicCommand } from "./base";

type CommandOpts = {
  type: VaultRemoteSource;
  vault: DVault;
};

type CommandOutput = { updatedVault: DVault | null };

export { CommandOpts as VaultConvertCommandOpts };

export class VaultConvertCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.VAULT_CONVERT.key;

  async gatherInputs(): Promise<CommandOpts | undefined> {
    return undefined;
  }

  /**
   * Returns all vaults added
   * @param opts
   * @returns
   */
  async execute(opts: CommandOpts) {
    return { updatedVault: null };
  }
}
