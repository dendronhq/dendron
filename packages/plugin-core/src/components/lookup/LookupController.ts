import * as vscode from "vscode";

import { LookupProvider } from "./LookupProvider";
import _ from "lodash";
import { createLogger } from "@dendron/common-server";
import { engine } from "@dendron/engine-server";

let LOOKUP_PROVIDER: null | LookupProvider = null;
const L = createLogger("LookupController");

export class LookupController {
  // constructor() {
  //   engine()
  //     .query({ username: "DUMMY" }, "**/*", "note", {
  //       initialQuery: true,
  //     })
  //     .then(() => {
  //       L.info({ ctx: "cons:exit" });
  //     });
  // }

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
