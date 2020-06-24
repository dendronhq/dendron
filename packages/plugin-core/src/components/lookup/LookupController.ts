import * as vscode from "vscode";

import { Disposable } from "../../vs/base/common/lifecycle";
import { LookupProvider } from "./LookupProvider";
import _ from "lodash";
import { createLogger } from "@dendron/common-server";
import { engine } from "@dendron/engine-server";
import { once } from "../../vs/base/common/functional";

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

    // cleanup quickpick
    once(quickpick.onDidHide)(() => {
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
