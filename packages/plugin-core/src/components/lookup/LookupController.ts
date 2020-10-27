import { DNode, Note } from "@dendronhq/common-all";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { QuickInputButton } from "vscode";
import { LookupCommandOpts } from "../../commands/LookupCommand";
import { CONFIG } from "../../constants";
import { Logger } from "../../logger";
import { VSCodeUtils } from "../../utils";
import { DendronClientUtilsV2 } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import {
  ButtonType,
  createAllButtons,
  DendronBtn,
  getButtonCategory,
  IDendronQuickInputButton,
  refreshButtons,
} from "./buttons";
import {
  DendronQuickPicker,
  DendronQuickPickerV2,
  EngineOpts,
  LookupProvider,
} from "./LookupProvider";
import { LookupControllerState } from "./types";

export class LookupController {
  public quickPick: DendronQuickPicker | DendronQuickPickerV2 | undefined;
  public state: LookupControllerState;
  public ws: DendronWorkspace;
  protected opts: EngineOpts;

  constructor(
    workspace: DendronWorkspace,
    opts: EngineOpts,
    lookupOpts?: LookupCommandOpts
  ) {
    let lookupSelectionType =
      lookupOpts?.selectionType ||
      (DendronWorkspace.configuration().get<string>(
        CONFIG.DEFAULT_LOOKUP_CREATE_BEHAVIOR.key
      ) as ButtonType);
    let noteSelectioType = lookupOpts?.noteType;
    let initialTypes = [lookupSelectionType];
    if (noteSelectioType) {
      initialTypes.push(noteSelectioType);
    }
    if (lookupOpts?.splitType) {
      initialTypes.push(lookupOpts.splitType);
    }
    this.state = {
      buttons: createAllButtons(initialTypes),
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
    const ctx = "updatePickerBehavior";
    const { document, range, quickPick, quickPickValue, provider } = opts;
    const buttons = this.state.buttons;
    const resp = _.filter(buttons, { pressed: true });
    Logger.info({ ctx, resp });
    const selectionResp = _.find(
      resp,
      (ent) => getButtonCategory(ent) === "selection"
    );
    const noteResp = _.find(resp, (ent) => getButtonCategory(ent) === "note");

    // determine value
    switch (noteResp?.type) {
      case "journal": {
        let value: string;
        if (DendronWorkspace.lsp()) {
          value = DendronClientUtilsV2.genNoteName("JOURNAL");
        } else {
          value = VSCodeUtils.genNoteName("JOURNAL");
        }
        quickPick.value = value;
        provider.onUpdatePickerItem(quickPick, provider.opts);
        break;
      }
      case "scratch": {
        let value: string;
        if (DendronWorkspace.lsp()) {
          value = DendronClientUtilsV2.genNoteName("SCRATCH");
        } else {
          value = VSCodeUtils.genNoteName("SCRATCH");
        }
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
      switch (selectionResp?.type) {
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
              // @ts-ignore
              if (!selection.isEmpty) {
                // @ts-ignore
                builder.replace(selection, `[[${text}|${link}]]`);
              }
            });
          }
          break;
        }
        default: {
          quickPick.onCreate = async () => {};
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
    const ctx = "LookupController:show";
    const cleanOpts = _.defaults(opts, {
      ignoreFocusOut: true,
    });
    const { document, range } = cleanOpts;
    this.ws.L.info({ ctx });
    // create quick pick
    const quickPick = vscode.window.createQuickPick<
      DNode
    >() as DendronQuickPicker;
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

      const btnTriggered = _.find(this.state.buttons, {
        type: btnType,
      }) as DendronBtn;
      if (!btnTriggered) {
        throw Error("bad button type");
      }
      btnTriggered.pressed = !btnTriggered.pressed;
      const btnCategory = getButtonCategory(btnTriggered);
      _.filter(this.state.buttons, (ent) => ent.type !== btnTriggered.type).map(
        (ent) => {
          if (getButtonCategory(ent) === btnCategory) {
            ent.pressed = false;
          }
        }
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
    quickPick.show();
    this.quickPick = quickPick;
    return quickPick;
  }
}
