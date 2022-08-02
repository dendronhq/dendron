import { NoteProps, NoteUtils, VaultUtils } from "@dendronhq/common-all";
import { inject, injectable } from "tsyringe";
import * as vscode from "vscode";
import { URI, Utils } from "vscode-uri";
import { IReducedEngineAPIService } from "../engine/IReducedEngineApiService";
import { ILookupProvider } from "./lookup/ILookupProvider";
import { LookupQuickpickFactory } from "./lookup/LookupQuickpickFactory";

@injectable()
export class WebNoteLookupCmd {
  private _factory;
  constructor(
    factory: LookupQuickpickFactory,
    @inject("wsRoot") private wsRoot: URI,
    @inject("IReducedEngineAPIService")
    private engine: IReducedEngineAPIService,
    @inject("NoteProvider") private noteProvider: ILookupProvider
  ) {
    this._factory = factory;
  }

  static key = "dendron.lookupNote";

  public async run() {
    const result = await this._factory.showLookup({
      provider: this.noteProvider,
    });

    if (!result) {
      return;
    }

    result.items.forEach(async (value) => {
      // console.log(
      //   `Path is ${Utils.joinPath(this.wsRoot, "notes", value.fname + ".md")}`
      // );
      let note: NoteProps;

      if (value.id === "Create New") {
        const newNote = NoteUtils.create({
          fname: value.fname,
          vault: value.vault,
        });

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
        const res = await this.engine.writeNote(newNote); // TODO: Error checking
        console.log("temp");
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
