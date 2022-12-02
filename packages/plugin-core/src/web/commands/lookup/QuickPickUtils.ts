import { DNodeUtils, DVault, NoteProps, URI } from "@dendronhq/common-all";
import { inject, injectable } from "tsyringe";
import { window } from "vscode";

export enum ProceedCancel {
  PROCEED = "proceed",
  CANCEL = "cancel",
}

@injectable()
export class QuickPickUtils {
  constructor(
    @inject("vaults") private vaults: DVault[],
    @inject("wsRoot") private wsRoot: URI
  ) {}
  /** Shows quick pick with proceed/cancel view which
   *  will be blocking until user picks an answer. */
  static async showProceedCancel(): Promise<ProceedCancel> {
    const proceedString = "proceed";

    const userChoice = await window.showQuickPick([proceedString, "cancel"], {
      placeHolder: proceedString,
      ignoreFocusOut: true,
    });

    if (userChoice === proceedString) {
      return ProceedCancel.PROCEED;
    } else {
      return ProceedCancel.CANCEL;
    }
  }

  /**
   *  Show a quick pick with the given notes as choices. Returns the chosen note
   *  or undefined if user cancelled the note selection.
   *  */
  async showChooseNote(notes: NoteProps[]): Promise<NoteProps | undefined> {
    const inputItems = await Promise.all(
      notes.map(async (ent) => {
        return DNodeUtils.enhancePropForQuickInputV3({
          wsRoot: this.wsRoot.fsPath,
          props: ent,
          vaults: this.vaults,
        });
      })
    );

    const chosen = await window.showQuickPick(inputItems);
    if (chosen === undefined) {
      return undefined;
    } else {
      return chosen;
    }
  }
}
