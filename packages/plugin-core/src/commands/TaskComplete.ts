import { ConfigUtils } from "@dendronhq/common-all";
import { DENDRON_COMMANDS } from "../constants";
import { BasicCommand } from "./base";
import { VSCodeUtils, MessageSeverity } from "../vsCodeUtils";
import { IDendronExtension } from "../dendronExtensionInterface";
import { TaskStatusCommand } from "./TaskStatus";
import { ConfigureCommand } from "./ConfigureCommand";

type CommandOpts = {};

type CommandOutput = {} | undefined;

export class TaskCompleteCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.TASK_COMPLETE.key;
  public static requireActiveWorkspace: boolean = true;
  private _ext: IDendronExtension;

  constructor(extension: IDendronExtension) {
    super();
    this._ext = extension;
  }

  async execute(_opts: CommandOpts) {
    const complete: string | undefined = ConfigUtils.getTask(
      await this._ext.getDWorkspace().config
    ).taskCompleteStatus[0];

    if (complete === undefined) {
      const title = "Open the configuration file";

      await VSCodeUtils.showMessage(
        MessageSeverity.ERROR,
        "You have no task statuses marked as complete. Please add something to 'taskCompleteStatus' in your configuration file. See: https://wiki.dendron.so/notes/SEASewZSteDK7ry1AshNG#taskcompletestatus",
        {},
        { title }
      ).then((pressed) => {
        if (pressed?.title === title) {
          const openConfig = new ConfigureCommand(this._ext);
          openConfig.run();
        }
      });
      return {};
    }

    const taskStatusCmd = new TaskStatusCommand(this._ext);
    return taskStatusCmd.run({
      setStatus: complete,
    });
  }
}
