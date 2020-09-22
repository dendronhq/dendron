import { DNode, Note } from "@dendronhq/common-all";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { QuickInputButton } from "vscode";
import { CONFIG } from "../../constants";
import { Logger } from "../../logger";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import {
  ButtonType,
  createAllButtons,
  IDendronQuickInputButton,
  refreshButtons,
} from "./buttons";
import {
  DendronQuickPicker,
  EngineOpts,
  LookupProvider,
} from "./LookupProvider";

type State = {
  buttons: IDendronQuickInputButton[];
};

export class LookupController {
  public quickPick: vscode.QuickPick<DNode> | undefined;
  public state: State;
  public ws: DendronWorkspace;
  protected opts: EngineOpts;

  constructor(workspace: DendronWorkspace, opts: EngineOpts) {
    const btnType = DendronWorkspace.configuration().get<string>(
      CONFIG.DEFAULT_LOOKUP_CREATE_BEHAVIOR.key
    ) as ButtonType;
    this.state = {
      buttons: createAllButtons(btnType),
    };
    this.ws = workspace;
    this.opts = opts;
  }

  updatePickerBehavior(opts: {
    quickPick: DendronQuickPicker;
    document?: vscode.TextDocument;
    range?: vscode.Range;
    quickPickValue?: string;
    provider: LookupProvider;
  }) {
    const { document, range, quickPick, quickPickValue, provider } = opts;
    const buttons = this.state.buttons;
    const resp = _.find(buttons, { pressed: true });
    if (!resp) {
      quickPick.onCreate = async () => {};
      return;
    }
    // determine value
    switch (resp.type) {
      case "journal": {
        const value = VSCodeUtils.genNoteName("JOURNAL");
        quickPick.value = value;
        provider.onUpdatePickerItem(quickPick, provider.opts);
        break;
      }
      case "scratch": {
        const value = VSCodeUtils.genNoteName("SCRATCH");
        quickPick.value = value;
        provider.onUpdatePickerItem(quickPick, provider.opts);
        break;
      }
      default:
        if (quickPickValue) {
          quickPick.value = quickPickValue;
        } else {
          let editorPath = vscode.window.activeTextEditor?.document.uri.fsPath;
          if (editorPath && this.opts.flavor !== "schema") {
            quickPick.value = path.basename(editorPath, ".md");
          }
        }
        provider.onUpdatePickerItem(quickPick, provider.opts);
    }
    quickPick.onCreate = async (note: Note) => {
      const ctx = "onCreate";
      Logger.info({ ctx, btnType: resp.type });
      switch (resp.type) {
        case "selectionExtract": {
          if (!_.isUndefined(document)) {
            const body = "\n" + document.getText(range).trim();
            note.body = body;
            await VSCodeUtils.deleteRange(document, range as vscode.Range);
          }
          break;
        }
        case "selection2link": {
          if (!_.isUndefined(document)) {
            const editor = VSCodeUtils.getActiveTextEditor();
            const { selection, text } = VSCodeUtils.getSelection();
            await editor?.edit((builder) => {
              const link = note.fname;
              if (!selection.isEmpty) {
                builder.replace(selection, `[[${text}|${link}]]`);
              }
            });
          }
          break;
        }
        default: {
          vscode.window.showInformationMessage("no action");
        }
      }
    };
  }

  show(opts?: {
    value?: string;
    ignoreFocusOut?: boolean;
    document?: vscode.TextDocument;
    range?: vscode.Range;
  }) {
    const ctx = "show";
    const cleanOpts = _.defaults(opts, {
      ignoreFocusOut: true,
    });
    const { document, range } = cleanOpts;
    this.ws.L.info({ ctx });
    // const provider = this.getOrInstantiateProvider();
    this.ws.L.info({ ctx: ctx + ":getOrInstantiateProvider:post" });
    // create quick pick
    const quickPick = vscode.window.createQuickPick<
      DNode
    >() as DendronQuickPicker;
    this.ws.L.info({ ctx: ctx + ":createQuickPick:post" });
    let title = ["Lookup"];
    title.push(`- version: ${DendronWorkspace.version()}`);
    quickPick.title = title.join(" ");
    quickPick.placeholder = "eg. hello.world";
    quickPick.ignoreFocusOut = cleanOpts.ignoreFocusOut;
    quickPick.justActivated = true;
    const provider = new LookupProvider(this.opts);

    this.updatePickerBehavior({
      quickPick,
      document,
      range,
      quickPickValue: cleanOpts.value,
      provider,
    });
    refreshButtons(quickPick, this.state.buttons);

    quickPick.onDidTriggerButton((btn: QuickInputButton) => {
      const btnType = (btn as IDendronQuickInputButton).type;

      const btnTriggered = _.find(this.state.buttons, { type: btnType });
      if (!btnTriggered) {
        throw Error("bad button type");
      }
      btnTriggered.pressed = !btnTriggered.pressed;
      _.filter(this.state.buttons, (ent) => ent.type !== btnTriggered.type).map(
        (ent) => (ent.pressed = false)
      );
      refreshButtons(quickPick, this.state.buttons);
      this.updatePickerBehavior({ quickPick, document, range, provider });
    });

    // cleanup quickpick
    quickPick.onDidHide(() => {
      quickPick.dispose();
      this.quickPick = undefined;
    });

    provider.provide(quickPick);
    this.ws.L.info({ ctx: ctx + ":provide:post" });
    // show
    quickPick.show();
    this.ws.L.info({ ctx: ctx + ":show:post" });
    return quickPick;
  }
}
