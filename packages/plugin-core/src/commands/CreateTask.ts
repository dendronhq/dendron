import { ConfigUtils, LookupNoteTypeEnum } from "@dendronhq/common-all";
import { DENDRON_COMMANDS } from "../constants";
import { Logger } from "../logger";
import { getDWorkspace } from "../workspace";
import { BasicCommand } from "./base";
import { CommandOutput as NoteLookupOutput } from "./NoteLookupCommand";
import { AutoCompletableRegistrar } from "../utils/registers/AutoCompletableRegistrar";

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

    return AutoCompletableRegistrar.getNoteLookupCmd().run({
      noteType: LookupNoteTypeEnum.task,
      selectionType: createTaskSelectionType,
    });
  }
}
