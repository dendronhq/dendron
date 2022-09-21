import { Logger } from "../logger";
import { DENDRON_COMMANDS } from "../constants";
import { BasicCommand } from "./base";
import { LookupControllerV3CreateOpts } from "../components/lookup/LookupControllerV3";
import { ILookupControllerV3 } from "../components/lookup/LookupControllerV3Interface";
import {
  CopyNoteLinkBtn,
  HorizontalSplitBtn,
  ScratchBtn,
  Selection2LinkBtn,
} from "../components/lookup/buttons";
import {
  CommandRunOpts as NoteLookupRunOpts,
  NoteLookupCommand,
} from "./NoteLookupCommand";
import { IDendronExtension } from "../dendronExtensionInterface";
import { ConfigUtils } from "@dendronhq/common-all";
import { VaultSelectionModeConfigUtils } from "../components/lookup/vaultSelectionModeConfigUtils";
import { FeatureShowcaseToaster } from "../showcase/FeatureShowcaseToaster";
import { CreateScratchNoteKeybindingTip } from "../showcase/CreateScratchNoteKeybindingTip";
import { MetadataService } from "@dendronhq/engine-server";
import semver from "semver";

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
        ScratchBtn.create({ pressed: true, canToggle: false }),
        Selection2LinkBtn.create(true),
        CopyNoteLinkBtn.create(false),
        HorizontalSplitBtn.create(false),
      ],
      title: "Create Scratch Note",
    };
    const controller = this.extension.lookupControllerFactory.create(opts);
    return controller;
  }

  async execute(opts: CommandOpts) {
    const ctx = "CreateScratchNote";
    Logger.info({ ctx, msg: "enter" });
    const lookupCmd = new NoteLookupCommand();
    lookupCmd.controller = this.createLookupController();
    await lookupCmd.run(opts);

    // TODO: remove after 1-2 weeks.
    const firstInstallVersion = MetadataService.instance().firstInstallVersion;
    if (
      firstInstallVersion === undefined ||
      semver.lt(firstInstallVersion, "0.113.0")
    ) {
      const showcase = new FeatureShowcaseToaster();
      showcase.showSpecificToast(new CreateScratchNoteKeybindingTip());
    }
  }
}
