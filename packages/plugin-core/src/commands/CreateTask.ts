import {
  ConfigUtils,
  LookupNoteTypeEnum,
  NoteAddBehaviorEnum,
} from "@dendronhq/common-all";
import { DENDRON_COMMANDS } from "../constants";
import { Logger } from "../logger";
import { BasicCommand } from "./base";
import {
  CommandOutput as NoteLookupOutput,
  NoteLookupCommand,
} from "./NoteLookupCommand";
import { ExtensionProvider } from "../ExtensionProvider";
import { maybeSendMeetingNoteTelemetry } from "../utils/MeetingTelemHelper";

type CommandOpts = {};

type CommandOutput = {
  lookup: Promise<NoteLookupOutput | undefined>;
  addBehavior: NoteAddBehaviorEnum;
};

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
    const ws = ExtensionProvider.getDWorkspace();
    const config = await ws.config;
    const { createTaskSelectionType, addBehavior } =
      ConfigUtils.getTask(config);

    maybeSendMeetingNoteTelemetry("task");

    return {
      lookup: new NoteLookupCommand().run({
        noteType: LookupNoteTypeEnum.task,
        selectionType: createTaskSelectionType,
      }),
      addBehavior,
    };
  }

  addAnalyticsPayload(_opts: CommandOpts, res: CommandOutput) {
    return {
      addBehavior: res.addBehavior,
    };
  }
}
