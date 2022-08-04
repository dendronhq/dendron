import { NoteUtils, VaultUtils } from "@dendronhq/common-all";
import { inject, injectable } from "tsyringe";
import * as vscode from "vscode";
import { URI, Utils } from "vscode-uri";
import { IReducedEngineAPIService } from "../engine/IReducedEngineApiService";
import { ILookupProvider } from "./lookup/ILookupProvider";
import { LookupQuickpickFactory } from "./lookup/LookupQuickpickFactory";

@injectable()
export class NoteLookupCmd {
  constructor(
    private factory: LookupQuickpickFactory,
    @inject("wsRoot") private wsRoot: URI,
    @inject("IReducedEngineAPIService")
    private engine: IReducedEngineAPIService,
    @inject("NoteProvider") private noteProvider: ILookupProvider
  ) {}

  static key = "dendron.lookupNote";

  public async run() {
    const result = await this.factory.showLookup({
      provider: this.noteProvider,
    });

    if (!result) {
      return;
    }

    result.items.forEach(async (value) => {
      if (value.label === "Create New") {
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
          vscode.window.showErrorMessage("Failed to write note to engine!");
        }
      }

      const doc = await vscode.workspace.openTextDocument(
        Utils.joinPath(
          this.wsRoot,
          VaultUtils.getRelPath(value.vault),
          value.fname + ".md"
        )
      );

      await vscode.window.showTextDocument(doc);
    });
  }
}
