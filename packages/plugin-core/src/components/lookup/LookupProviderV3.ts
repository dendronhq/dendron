import { window } from "vscode";
import { LookupControllerV3 } from "./LookupControllerV3";
import { DendronQuickPickerV2 } from "./types";

export type ILookupProviderV3 = {
  provide: (lc: LookupControllerV3) => Promise<void>;
};

export class LookupProviderV3 {
  provide(lc: LookupControllerV3) {
    const quickpick = lc.quickpick;
    if (!quickpick) {
      return;
    }
    quickpick.onDidAccept(this.onDidAccept({ quickpick, lc }));
  }

  onDidAccept(_opts: {
    quickpick: DendronQuickPickerV2;
    lc: LookupControllerV3;
  }) {
    return () => {
      window.showInformationMessage("on accept");
    };
  }
}
