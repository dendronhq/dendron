import {
  type ReducedDEngine,
  NoteUtils,
  VaultUtils,
  VSCodeEvents,
  ConfigUtils,
  DendronConfig,
  getJournalTitle,
  NoteProps,
  NoteQuickInputV2,
} from "@dendronhq/common-all";
import _ from "lodash";
import { inject, injectable } from "tsyringe";
import * as vscode from "vscode";
import { URI, Utils } from "vscode-uri";
import { VaultSelectionMode } from "../../components/lookup/types";
import { DENDRON_COMMANDS } from "../../constants";
import { type ITelemetryClient } from "../../telemetry/common/ITelemetryClient";
import { type ILookupProvider } from "./lookup/ILookupProvider";
import {
  LookupController,
  LookupControllerCreateOpts,
} from "./lookup/LookupController";

@injectable()
export class NoteLookupCmd {
  constructor(
    private factory: LookupController,
    @inject("wsRoot") private wsRoot: URI,
    @inject("ReducedDEngine")
    private engine: ReducedDEngine,
    @inject("NoteProvider") private noteProvider: ILookupProvider,
    @inject("ITelemetryClient") private _analytics: ITelemetryClient,
    @inject("DendronConfig") private config: DendronConfig
  ) {}

  public async run(_opts?: LookupControllerCreateOpts) {
    this._analytics.track(DENDRON_COMMANDS.LOOKUP_NOTE.key);
    const opts = _opts || {
      provider: this.noteProvider,
    };
    const lookupConfig = ConfigUtils.getCommands(this.config).lookup;
    const noteLookupConfig = lookupConfig.note;
    if (opts?.vaultSelectionMode) {
      opts.vaultButtonPressed =
        opts.vaultSelectionMode === VaultSelectionMode.alwaysPrompt;
    } else {
      const vaultSelectionMode = noteLookupConfig.vaultSelectionModeOnCreate;
      opts.vaultButtonPressed = vaultSelectionMode === "alwaysPrompt";
    }
    opts.disableVaultSelection = !noteLookupConfig.confirmVaultOnCreate;

    const result = await this.factory.showLookup(opts);

    if (!result) {
      return;
    }

    let isNew = false;

    await Promise.all(
      result.items.map(async (value) => {
        let newNote: NoteProps | undefined;
        if (value.stub) {
          newNote = this.prepareStubItem(value);
        }
        if (value.label === "Create New") {
          isNew = true;
          let title;
          if (this.factory.isJournalButtonPressed()) {
            const journalDateFormat = ConfigUtils.getJournal(
              this.config
            ).dateFormat;
            title = getJournalTitle(value.fname, journalDateFormat);
          }
          newNote = NoteUtils.create({
            fname: value.fname,
            vault: value.vault,
            title,
          });

          // TODO: Add Schema and Template functionality
          // const newNote = NoteUtils.createWithSchema({
          //   noteOpts: {
          //     fname: value.fname,
          //     vault: value.vault,
          //   },
          //   engine: this.engine as DEngineClient, // TODO: Remove cast
          // });
          // await TemplateUtils.findAndApplyTemplate({
          //   note: newNote,
          //   engine: client,
          //   pickNote: async (choices: NoteProps[]) => {
          //     return WSUtilsV2.instance().promptForNoteAsync({
          //       notes: choices,
          //       quickpickTitle:
          //         "Select which template to apply or press [ESC] to not apply a template",
          //       nonStubOnly: true,
          //     });
          //   },
          // });
          // note = _.merge(newNote, overrides || {});
        }
        if (newNote) {
          const res = await this.engine.writeNote(newNote);

          if (res.error) {
            vscode.window.showErrorMessage(
              `Failed to write note to engine! Error: ${res.error}`
            );
          }
        }

        const doc = await vscode.workspace.openTextDocument(
          // TODO: Replace with getURIForNote utils method
          Utils.joinPath(
            this.wsRoot,
            VaultUtils.getRelPath(value.vault),
            value.fname + ".md"
          )
        );

        await vscode.window.showTextDocument(doc);
      })
    );

    this._analytics.track(VSCodeEvents.NoteLookup_Accept, { isNew });
  }

  prepareStubItem(value: NoteQuickInputV2) {
    const props = _.omit(value, "label", "detail", "alwaysShow", "stub");
    return props as NoteProps;
  }
}
