import { DEngineClient, NoteProps, NoteUtils } from "@dendronhq/common-all";
import { IReducedEngineAPIService } from "packages/plugin-common/lib";
import * as vscode from "vscode";
import { URI, Utils } from "vscode-uri";
import { WSUtilsWeb } from "../utils/WSUtils";
import { LookupQuickpickFactory } from "./lookup/LookupQuickpickFactory";

export class WebNoteLookupCmd {
  private _factory;
  constructor(
    factory: LookupQuickpickFactory,
    private wsRoot: URI,
    private engine: IReducedEngineAPIService
  ) {
    this._factory = factory;
  }

  static key = "dendron.lookupNote";

  public async run() {
    // const note = await this.wsUtils.getActiveNote();

    const result = await this._factory.ShowLookup({
      // initalValue: "foo",
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
        await this.engine.writeNote(newNote); // TODO: Error checking
      }

      // TODO: Adjust for native vs non-native vault
      const doc = await vscode.workspace.openTextDocument(
        Utils.joinPath(this.wsRoot, "notes", value.fname + ".md")
      );

      await vscode.window.showTextDocument(doc);
    });
  }
}
