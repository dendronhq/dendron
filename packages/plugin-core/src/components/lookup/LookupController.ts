import * as vscode from "vscode";

import { LookupProvider } from "./LookupProvider";
import _ from "lodash";
import { createLogger } from "@dendronhq/common-server";
import { engine } from "@dendronhq/engine-server";

let LOOKUP_PROVIDER: null | LookupProvider = null;
const L = createLogger("LookupController");

export class LookupController {
  show(_value = "") {
    const ctx = "show";
    L.info({ ctx });
    const provider = this.getOrInstantiateProvider();
    L.info({ ctx: ctx + ":getOrInstantiateProvider:post" });
    // create quick pick
    const quickpick = vscode.window.createQuickPick();
    L.info({ ctx: ctx + ":createQuickPick:post" });

    quickpick.title = "quickpick title";
    quickpick.placeholder = "quickpick placeholder";
    quickpick.ignoreFocusOut = true;
    quickpick.items = _.values(engine().notes);
    quickpick.matchOnDetail = true;

    // cleanup quickpick
    quickpick.onDidHide(() => {
      quickpick.dispose();
    });

    provider.provide(quickpick);
    L.info({ ctx: ctx + ":provide:post" });
    // show
    quickpick.show();
    L.info({ ctx: ctx + ":show:post" });
  }

  getOrInstantiateProvider() {
    if (_.isNull(LOOKUP_PROVIDER)) {
      LOOKUP_PROVIDER = new LookupProvider();
    }
    return LOOKUP_PROVIDER;
  }
}
