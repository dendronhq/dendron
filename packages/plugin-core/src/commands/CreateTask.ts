import { ConfigUtils } from "@dendronhq/common-all";
import { LookupNoteTypeEnum } from "../components/lookup/types";
import { DENDRON_COMMANDS } from "../constants";
import { Logger } from "../logger";
import { getDWorkspace } from "../workspace";
import { BasicCommand } from "./base";
import {
  NoteLookupCommand,
  CommandOutput as NoteLookupOutput,
} from "./NoteLookupCommand";

type CommandOpts = {};

type CommandOutput = NoteLookupOutput | undefined;

export { CommandOpts as CreateTaskOpts };

export class CreateTaskCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.TASK_CREATE.key;

  /**
   * Returns all vaults added
   * @param opts
   * @returns
   */
  async execute(opts: CommandOpts) {
    const ctx = "CreateTask";

    Logger.info({ ctx, msg: "enter", opts });
    const { config } = getDWorkspace();
    const { createTaskSelectionType } = ConfigUtils.getTask(config);

    const cmd = new NoteLookupCommand();
    return cmd.run({
      noteType: LookupNoteTypeEnum.task,
      selectionType: createTaskSelectionType,
    });
  }
}
