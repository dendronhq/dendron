// import { Logger } from "../logger";
import { DENDRON_COMMANDS } from "../constants";
import { BasicCommand } from "./base";
import { CommandOpts as NoteLookupCommandOpts } from "./NoteLookupCommand";
import { LookupControllerV3CreateOpts } from "../components/lookup/LookupControllerV3";
import { ILookupControllerV3 } from "../components/lookup/LookupControllerV3Interface";
import {
  ILookupProviderV3,
  ILookupProviderOptsV3,
  NoteLookupProviderSuccessResp,
} from "../components/lookup/LookupProviderV3Interface";
import {
  CopyNoteLinkBtn,
  HorizontalSplitBtn,
  JournalBtn,
} from "../components/lookup/buttons";
import { IDendronExtension } from "../dendronExtensionInterface";
import { NoteLookupProviderUtils } from "../components/lookup/NoteLookupProviderUtils";
import { HistoryEvent } from "@dendronhq/engine-server";
import { AutoCompletableRegistrar } from "../utils/registers/AutoCompletableRegistrar";

type CommandOpts = void;
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
    const opts: LookupControllerV3CreateOpts = {
      nodeType: "note",
      buttons: [
        CopyNoteLinkBtn.create(false),
        JournalBtn.create(true),
        HorizontalSplitBtn.create(false),
      ],
    };
    const controller = this.extension.lookupControllerFactory.create(opts);
    return controller;
  }

  createLookupProvider(): ILookupProviderV3 {
    const opts: ILookupProviderOptsV3 = {
      allowNewNote: true,
    };
    const provider = this.extension.noteLookupProviderFactory.create(
      this.key,
      opts
    );
    return provider;
  }

  async promptLookup() {
    const controller = this.createLookupController();
    const provider = this.createLookupProvider();
    return new Promise((resolve) => {
      NoteLookupProviderUtils.subscribe({
        id: this.key,
        controller,
        logger: this.L,
        onDone: (event: HistoryEvent) => {
          const data = event.data as NoteLookupProviderSuccessResp;
          if (data.cancel) {
            resolve(undefined);
          }
          resolve({
            controller,
            provider,
            quickpick: controller.quickpick,
            selectedItems: data.selectedItems,
          });
        },
        onHide: () => {
          resolve(undefined);
        },
      });
      controller.show({
        title: "Enter title of journal note",
        placeholder: "title",
        provider,
      });
    });
  }

  async execute() {
    // const ctx = "CreateJournalNote";
    // Logger.info({ ctx, msg: "enter", opts });
    const res = (await this.promptLookup()) as NoteLookupCommandOpts;
    console.log({ res });
    const lookupCmd = AutoCompletableRegistrar.getNoteLookupCmd();
    lookupCmd.AutoCompletableRegistrar.getNoteLookupCmd().execute(res);
  }
}
