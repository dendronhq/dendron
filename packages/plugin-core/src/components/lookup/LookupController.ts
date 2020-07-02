import { getOrCreateEngine } from "@dendronhq/engine-server";
import _, { update } from "lodash";
import path from "path";
import * as vscode from "vscode";
import { LookupProvider } from "./LookupProvider";
import { createLogger } from "@dendronhq/common-server";
import { DNode } from "@dendronhq/common-all/src";
import { Uri, QuickInputButton, ThemeIcon } from "vscode";


let LOOKUP_PROVIDER: null | LookupProvider = null;
const L = createLogger("dendron");

type ButtonType = "fuzzy_match"

type DendronQuickInputButton = QuickInputButton & {
  type: ButtonType
};

class FuzzyMatchButton implements DendronQuickInputButton {
  public iconPathNormal: ThemeIcon;
  public iconPathPressed: ThemeIcon;
  public tooltip: string;
  public type: ButtonType;
  public pressed: boolean;

  constructor(pressed?: boolean) {
    this.pressed = pressed || false;
    this.iconPathNormal = new vscode.ThemeIcon("symbol-constant");
    this.iconPathPressed = new vscode.ThemeIcon("squirrel");
    this.tooltip = "fuzzy search";
    this.type = "fuzzy_match";
  }

  get iconPath() {
    return !this.pressed ? this.iconPathNormal : this.iconPathPressed;
  }
}


type State = {
  mode: "fuzzy" | "exact"
  buttons: {
    fuzzyMatch: FuzzyMatchButton
  }
};

export class LookupController {

  public quickPick: vscode.QuickPick<DNode> | undefined;
  public state: State

  constructor() {
    this.state = {
      mode: "exact", buttons: {
        fuzzyMatch: new FuzzyMatchButton()
      }
    };
  }

  updateButton(btn: DendronQuickInputButton) {
    // FIXME: if mult buttons, this won't work
    if (this.quickPick) {
      this.quickPick.buttons = [btn];
    }
  }

  show(_value = "") {
    const ctx = "show";
    L.info({ ctx });
    const provider = this.getOrInstantiateProvider();
    L.info({ ctx: ctx + ":getOrInstantiateProvider:post" });
    // create quick pick
    const quickpick = vscode.window.createQuickPick<DNode>();
    this.quickPick = quickpick;
    L.info({ ctx: ctx + ":createQuickPick:post" });
    let title = ["Lookup"];
    if (this.state.mode === "fuzzy") {
      title.push("mode: fuzzy");
    }
    quickpick.title = title.join(" ");
    quickpick.placeholder = "eg. hello.world";
    quickpick.ignoreFocusOut = true;
    quickpick.buttons = [this.state.buttons.fuzzyMatch];
    quickpick.items = _.values(getOrCreateEngine().notes);

    // set editor path
    let editorPath = vscode.window.activeTextEditor?.document.uri.fsPath;
    if (editorPath) {
      quickpick.value = path.basename(editorPath, ".md");
    }

    quickpick.onDidTriggerButton((btn: QuickInputButton) => {
      const btnType = (btn as DendronQuickInputButton).type;

      switch (btnType) {
        case "fuzzy_match":
          const btn = this.state.buttons.fuzzyMatch;
          btn.pressed = !btn.pressed;
          this.updateButton(btn);
          getOrCreateEngine().updateProps({ mode: btn.pressed ? "fuzzy" : "exact" });
          vscode.window.showInformationMessage("fuzzy search");
          break;
        default:
          vscode.window.showErrorMessage(`bad buttton type: ${btnType}`)
      }
    })

    // cleanup quickpick
    quickpick.onDidHide(() => {
      quickpick.dispose();
      this.quickPick = undefined;
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
