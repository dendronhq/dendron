import * as vscode from "vscode";

import { CREATE_NEW_LABEL } from "./constants";
import { ExtensionContext } from "vscode";
import { LookupProvider } from "./LookupProvider";
import _ from "lodash";
import { createLogger } from "@dendronhq/common-server";
import { engine } from "@dendronhq/engine-server";

let LOOKUP_PROVIDER: null | LookupProvider = null;
const L = createLogger("LookupController");

export class LookupController {
  show(value = "") {
    const provider = this.getOrInstantiateProvider(value);

    // create quick pick
    const quickpick = vscode.window.createQuickPick();
    quickpick.title = "quickpick title";
    quickpick.placeholder = "quickpick placeholder";
    quickpick.ignoreFocusOut = true;
    quickpick.items = _.values(engine().notes);

    // cleanup quickpick
    quickpick.onDidHide(() => {
      quickpick.dispose();
    });

    provider.provide(quickpick);
    // show
    quickpick.show();
  }

  getOrInstantiateProvider(value: string) {
    if (_.isNull(LOOKUP_PROVIDER)) {
      LOOKUP_PROVIDER = new LookupProvider();
    }
    return LOOKUP_PROVIDER;
  }
}
