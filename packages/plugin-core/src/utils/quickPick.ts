import { DNodeUtils, NoteProps } from "@dendronhq/common-all";
import { VSCodeUtils } from "../vsCodeUtils";
import { ExtensionProvider } from "../ExtensionProvider";

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
    const inputItems = await Promise.all(
      notes.map(async (ent) => {
        const workspace = ExtensionProvider.getDWorkspace();
        return DNodeUtils.enhancePropForQuickInputV3({
          wsRoot: workspace.wsRoot,
          props: ent,
          schema: ent.schema
            ? (
                await ExtensionProvider.getEngine().getSchema(
                  ent.schema.moduleId
                )
              ).data
            : undefined,
          vaults: await workspace.vaults,
        });
      })
    );

    const chosen = await VSCodeUtils.showQuickPick(inputItems);
    if (chosen === undefined) {
      return undefined;
    } else {
      return chosen;
    }
  }
}
