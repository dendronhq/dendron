import { Logger } from "../logger";
import { DENDRON_COMMANDS } from "../constants";
import { BasicCommand } from "./base";
import { LookupControllerV3CreateOpts } from "../components/lookup/LookupControllerV3";
import { ILookupControllerV3 } from "../components/lookup/LookupControllerV3Interface";
import {
  CopyNoteLinkBtn,
  HorizontalSplitBtn,
  ScratchBtn,
} from "../components/lookup/buttons";
import { CommandRunOpts as NoteLookupRunOpts } from "./NoteLookupCommand";
import { AutoCompletableRegistrar } from "../utils/registers/AutoCompletableRegistrar";
import { IDendronExtension } from "../dendronExtensionInterface";

type CommandOpts = NoteLookupRunOpts;
type CommandOutput = void;

export { CommandOpts as LookupScratchNoteOpts };

export class CreateScratchNoteCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.CREATE_SCRATCH.key;
  private extension: IDendronExtension;

  constructor(ext: IDendronExtension) {
    super();
    this.extension = ext;
  }

  createLookupController(): ILookupControllerV3 {
    const opts: LookupControllerV3CreateOpts = {
      nodeType: "note",
      buttons: [
        ScratchBtn.create(true),
        CopyNoteLinkBtn.create(false),
        HorizontalSplitBtn.create(false),
      ],
      disableLookupView: true,
      title: "Create Scratch Note",
    };
    const controller = this.extension.lookupControllerFactory.create(opts);
    return controller;
  }

  async execute(opts: CommandOpts) {
    const ctx = "CreateScratchNote";
    Logger.info({ ctx, msg: "enter" });
    const lookupCmd = AutoCompletableRegistrar.getNoteLookupCmd();
    lookupCmd.controller = this.createLookupController();
    await lookupCmd.run(opts);
  }
}
