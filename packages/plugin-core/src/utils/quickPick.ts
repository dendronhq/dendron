import { VSCodeUtils } from "../utils";
import { DNodeUtils, NoteProps } from "@dendronhq/common-all";
import { getDWorkspace } from "../workspace";

export enum ProceedCancel {
  PROCEED = "proceed",
  CANCEL = "cancel",
}

export class QuickPickUtil {
  /** Shows quick pick with proceed/cancel view which
   *  will be blocking until user picks an answer. */
  static async showProceedCancel(): Promise<ProceedCancel> {
    const proceedString = "proceed";

    const userChoice = await VSCodeUtils.showQuickPick(
      [proceedString, "cancel"],
      {
        placeHolder: proceedString,
        ignoreFocusOut: true,
      }
    );

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
  static async showChooseNote(
    notes: NoteProps[]
  ): Promise<NoteProps | undefined> {
    const inputItems = notes.map((ent) => {
      const workspace = getDWorkspace();
      return DNodeUtils.enhancePropForQuickInputV3({
        wsRoot: workspace.wsRoot,
        props: ent,
        schemas: workspace.engine.schemas,
        vaults: workspace.vaults,
      });
    });

    const chosen = await VSCodeUtils.showQuickPick(inputItems);
    if (chosen === undefined) {
      return undefined;
    } else {
      return chosen;
    }
  }
}
