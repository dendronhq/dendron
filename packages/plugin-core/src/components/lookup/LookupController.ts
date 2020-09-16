import { DNode } from "@dendronhq/common-all";
import { DendronEngine } from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { QuickInputButton, ThemeIcon } from "vscode";
import { DendronWorkspace } from "../../workspace";
import {
  DendronQuickPicker,
  EngineOpts,
  LookupProvider,
} from "./LookupProvider";

type ButtonType = "fuzzy_match";

type DendronQuickInputButton = QuickInputButton & {
  type: ButtonType;
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
  mode: "fuzzy" | "exact";
  buttons: {
    fuzzyMatch: FuzzyMatchButton;
  };
};

export class LookupController {
  public quickPick: vscode.QuickPick<DNode> | undefined;
  public state: State;
  public ws: DendronWorkspace;
  protected opts: EngineOpts;

  constructor(workspace: DendronWorkspace, opts: EngineOpts) {
    this.state = {
      mode: "exact",
      buttons: {
        fuzzyMatch: new FuzzyMatchButton(),
      },
    };
    this.ws = workspace;
    this.opts = opts;
  }

  updateButton(btn: DendronQuickInputButton) {
    // FIXME: if mult buttons, this won't work
    if (this.quickPick) {
      this.quickPick.buttons = [btn];
    }
  }

  show(opts?: {
    value?: string;
    ignoreFocusOut?: boolean;
    onCreate?: DendronQuickPicker["onCreate"];
  }) {
    const ctx = "show";
    const cleanOpts = _.defaults(opts, {
      ignoreFocusOut: false,
      onCreate: async () => {
        return;
      },
    });
    this.ws.L.info({ ctx });
    // const provider = this.getOrInstantiateProvider();
    this.ws.L.info({ ctx: ctx + ":getOrInstantiateProvider:post" });
    // create quick pick
    const quickpick = vscode.window.createQuickPick<
      DNode
    >() as DendronQuickPicker;
    this.ws.L.info({ ctx: ctx + ":createQuickPick:post" });
    let title = ["Lookup"];
    if (this.state.mode === "fuzzy") {
      title.push("mode: fuzzy");
    }
    title.push(`- version: ${DendronWorkspace.version()}`);
    quickpick.title = title.join(" ");
    quickpick.placeholder = "eg. hello.world";
    quickpick.ignoreFocusOut = cleanOpts.ignoreFocusOut;
    quickpick.justActivated = true;
    quickpick.onCreate = cleanOpts.onCreate;
    // FIXME: no button for now
    // quickpick.buttons = [this.state.buttons.fuzzyMatch];
    // quickpick.items = _.values(DendronEngine.getOrCreateEngine().notes);

    let { value } = cleanOpts;
    if (!_.isUndefined(value)) {
      quickpick.value = value;
    } else {
      // set editor path
      let editorPath = vscode.window.activeTextEditor?.document.uri.fsPath;
      if (editorPath && this.opts.flavor !== "schema") {
        quickpick.value = path.basename(editorPath, ".md");
      }
    }

    quickpick.onDidTriggerButton((btn: QuickInputButton) => {
      const btnType = (btn as DendronQuickInputButton).type;

      switch (btnType) {
        case "fuzzy_match":
          const btn = this.state.buttons.fuzzyMatch;
          btn.pressed = !btn.pressed;
          this.updateButton(btn);
          DendronEngine.getOrCreateEngine().updateProps({
            mode: btn.pressed ? "fuzzy" : "exact",
          });
          vscode.window.showInformationMessage("fuzzy search");
          break;
        default:
          vscode.window.showErrorMessage(`bad buttton type: ${btnType}`);
      }
    });

    // cleanup quickpick
    quickpick.onDidHide(() => {
      quickpick.dispose();
      this.quickPick = undefined;
    });

    const provider = new LookupProvider(this.opts);
    provider.provide(quickpick);
    this.ws.L.info({ ctx: ctx + ":provide:post" });
    // show
    quickpick.show();
    this.ws.L.info({ ctx: ctx + ":show:post" });
    return quickpick;
  }
}
