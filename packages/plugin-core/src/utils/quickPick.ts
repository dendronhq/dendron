import { VSCodeUtils } from "../utils";

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
}
