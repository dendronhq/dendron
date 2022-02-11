import { Logger } from "../logger";
import { DENDRON_COMMANDS } from "../constants";
import { BasicCommand } from "./base";
import { LookupControllerV3CreateOpts } from "../components/lookup/LookupControllerV3";
import { ILookupControllerV3 } from "../components/lookup/LookupControllerV3Interface";
import {
  CopyNoteLinkBtn,
  HorizontalSplitBtn,
  JournalBtn,
} from "../components/lookup/buttons";
import { CommandRunOpts as NoteLookupRunOpts } from "./NoteLookupCommand";
import { IDendronExtension } from "../dendronExtensionInterface";
import { AutoCompletableRegistrar } from "../utils/registers/AutoCompletableRegistrar";
import { ConfigUtils } from "@dendronhq/common-all";
import { VaultSelectionModeConfigUtils } from "../components/lookup/vaultSelectionModeConfigUtils";

type CommandOpts = NoteLookupRunOpts;
type CommandOutput = void;

export { CommandOpts as CreateJournalNoteOpts };

export class CreateJournalNoteCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.CREATE_JOURNAL.key;
  private extension: IDendronExtension;

  constructor(ext: IDendronExtension) {
    super();
    this.extension = ext;
  }

  createLookupController(): ILookupControllerV3 {
    const commandConfig = ConfigUtils.getCommands(
      this.extension.getDWorkspace().config
    );
    const confirmVaultOnCreate = commandConfig.lookup.note.confirmVaultOnCreate;
    const vaultButtonPressed =
      VaultSelectionModeConfigUtils.shouldAlwaysPromptVaultSelection();
    const opts: LookupControllerV3CreateOpts = {
      nodeType: "note",
      disableVaultSelection: !confirmVaultOnCreate,
      vaultButtonPressed,
      extraButtons: [
        JournalBtn.create({ pressed: true, canToggle: false }),
        CopyNoteLinkBtn.create(false),
        HorizontalSplitBtn.create(false),
      ],
      disableLookupView: true,
      title: "Create Journal Note",
    };
    const controller = this.extension.lookupControllerFactory.create(opts);
    return controller;
  }

  async execute(opts: CommandOpts) {
    const ctx = "CreateJournalNote";
    Logger.info({ ctx, msg: "enter" });
    const lookupCmd = AutoCompletableRegistrar.getNoteLookupCmd();
    lookupCmd.controller = this.createLookupController();
    await lookupCmd.run(opts);
  }
}
