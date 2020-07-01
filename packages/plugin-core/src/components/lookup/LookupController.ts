import { getOrCreateEngine } from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { LookupProvider } from "./LookupProvider";
import { createLogger } from "@dendronhq/common-server";
import { DNode } from "@dendronhq/common-all/src";


let LOOKUP_PROVIDER: null | LookupProvider = null;
const L = createLogger("dendron");

export class LookupController {

  public quickPick: vscode.QuickPick<DNode> | undefined;

  show(_value = "") {
    const ctx = "show";
    L.info({ ctx });
    const provider = this.getOrInstantiateProvider();
    L.info({ ctx: ctx + ":getOrInstantiateProvider:post" });
    // create quick pick
    const quickpick = vscode.window.createQuickPick();
    L.info({ ctx: ctx + ":createQuickPick:post" });

    quickpick.title = "Lookup";
    quickpick.placeholder = "eg. hello.world";
    quickpick.ignoreFocusOut = true;
    quickpick.items = _.values(getOrCreateEngine().notes);
    // quickpick.matchOnDetail = true;
    let editorPath = vscode.window.activeTextEditor?.document.uri.fsPath;
    if (editorPath) {
      quickpick.value = path.basename(editorPath, ".md");
    }

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
