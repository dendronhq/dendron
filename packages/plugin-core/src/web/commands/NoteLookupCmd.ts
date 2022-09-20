import {
  type ReducedDEngine,
  NoteUtils,
  VaultUtils,
  VSCodeEvents,
} from "@dendronhq/common-all";
import { inject, injectable } from "tsyringe";
import * as vscode from "vscode";
import { URI, Utils } from "vscode-uri";
import { DENDRON_COMMANDS } from "../../constants";
import { type ITelemetryClient } from "../../telemetry/common/ITelemetryClient";
import { type ILookupProvider } from "./lookup/ILookupProvider";
import { LookupQuickpickFactory } from "./lookup/LookupQuickpickFactory";

@injectable()
export class NoteLookupCmd {
  constructor(
    private factory: LookupQuickpickFactory,
    @inject("wsRoot") private wsRoot: URI,
    @inject("ReducedDEngine")
    private engine: ReducedDEngine,
    @inject("NoteProvider") private noteProvider: ILookupProvider,
    @inject("ITelemetryClient") private _analytics: ITelemetryClient
  ) {}

  public async run() {
    this._analytics.track(DENDRON_COMMANDS.LOOKUP_NOTE.key);

    const result = await this.factory.showLookup({
      provider: this.noteProvider,
    });

    if (!result) {
      return;
    }

    let isNew = false;

    await Promise.all(
      result.items.map(async (value) => {
        if (value.label === "Create New") {
          isNew = true;
          const newNote = NoteUtils.create({
            fname: value.fname,
            vault: value.vault,
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
}
