import { Logger } from "../logger";
import { DENDRON_COMMANDS } from "../constants";
import { BasicCommand } from "./base";
import {
  CommandOutput as NoteLookupOutput,
  CommandRunOpts as NoteLookupRunOpts,
} from "./NoteLookupCommand";
import { AutoCompletableRegistrar } from "../utils/registers/AutoCompletableRegistrar";
import { LookupNoteTypeEnum } from "../components/lookup/types";
import { LookupSelectionTypeEnum } from "@dendronhq/common-all";

type CommandOpts = NoteLookupRunOpts;
type CommandOutput = NoteLookupOutput | undefined;

export { CommandOpts as LookupScratchNoteOpts };

export class CreateScratchNoteCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.CREATE_SCRATCH.key;

  async execute(opts: CommandOpts) {
    const ctx = "CreateScratchNote";
    Logger.info({ ctx, msg: "enter", opts });
    const noteLookupRunOpts = {
      ...opts,
      noteType: LookupNoteTypeEnum.scratch,
      selectionType: LookupSelectionTypeEnum.selection2link,
    } as NoteLookupRunOpts;
    return AutoCompletableRegistrar.getNoteLookupCmd().run(noteLookupRunOpts);
  }
}
