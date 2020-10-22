import { DNodePropsQuickInputV2, NotePropsV2 } from "@dendronhq/common-all";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { QuickInputButton } from "vscode";
import {
  LookupCommandOpts,
  LookupNoteExistBehavior,
} from "../../commands/LookupCommand";
import { CONFIG } from "../../constants";
import { Logger } from "../../logger";
import { DendronClientUtilsV2, VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import {
  ButtonType,
  createAllButtons,
  DendronBtn,
  getButtonCategory,
  IDendronQuickInputButton,
  refreshButtons,
} from "./buttons";
import { DendronQuickPickerV2, EngineOpts } from "./LookupProvider";
import { LookupProviderV2 } from "./LookupProviderV2";
import { LookupControllerState } from "./types";

export class LookupControllerV2 {
  public quickPick?: DendronQuickPickerV2;
  public state: LookupControllerState;
  protected opts: EngineOpts;

  constructor(opts: EngineOpts, lookupOpts?: LookupCommandOpts) {
    // selection behaior
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

    // initialize rest
    this.state = {
      buttons: opts.flavor === "note" ? createAllButtons(initialTypes) : [],
    };
    this.opts = opts;
  }

  async show(opts?: {
    value?: string;
    ignoreFocusOut?: boolean;
    document?: vscode.TextDocument;
    range?: vscode.Range;
    noConfirm?: boolean;
    noteExistBehavior?: LookupNoteExistBehavior;
  }) {
    const ctx = "LookupControllerV2:show";
    const cleanOpts = _.defaults(opts, {
      ignoreFocusOut: true,
    });
    const { document, range } = cleanOpts;
    Logger.info({ ctx, msg: "enter", cleanOpts });
    // create quick pick
    const quickPick = vscode.window.createQuickPick<
      DNodePropsQuickInputV2
    >() as DendronQuickPickerV2;
    let title = [`Lookup (${this.opts.flavor})`];
    title.push(`- version: ${DendronWorkspace.version()}`);
    quickPick.title = title.join(" ");
    quickPick.placeholder = "eg. hello.world";
    quickPick.ignoreFocusOut = cleanOpts.ignoreFocusOut;
    quickPick.justActivated = true;
    const provider = new LookupProviderV2(this.opts);

    await this.updatePickerBehavior({
      quickPick,
      document,
      range,
      quickPickValue: cleanOpts.value,
      provider,
    });
    refreshButtons(quickPick, this.state.buttons);

    quickPick.onDidTriggerButton(async (btn: QuickInputButton) => {
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
      await this.updatePickerBehavior({
        quickPick,
        document,
        range,
        provider,
        changed: btnTriggered,
      });
    });

    // cleanup quickpick
    quickPick.onDidHide(() => {
      quickPick.dispose();
      this.quickPick = undefined;
    });

    provider.provide(quickPick);
    if (opts?.noConfirm) {
      // would be empty if not set
      quickPick.selectedItems = quickPick.items;
      await provider.onDidAccept(quickPick, { flavor: this.opts.flavor });
    } else {
      quickPick.show();
    }
    this.quickPick = quickPick;
    return quickPick;
  }

  async updatePickerBehavior(opts: {
    quickPick: DendronQuickPickerV2;
    document?: vscode.TextDocument;
    range?: vscode.Range;
    quickPickValue?: string;
    provider: LookupProviderV2;
    changed?: DendronBtn;
  }) {
    const ctx = "updatePickerBehavior";
    const { document, range, quickPick, quickPickValue, provider } = opts;
    const buttons = this.state.buttons;
    const resp = _.filter(buttons, { pressed: true });
    Logger.info({ ctx, activeButtons: resp });
    const noteResp = _.find(resp, (ent) => getButtonCategory(ent) === "note");
    const selectionResp = _.find(
      resp,
      (ent) => getButtonCategory(ent) === "selection"
    );
    const filterResp = _.find(
      resp,
      (ent) => getButtonCategory(ent) === "filter"
    );
    // handle note resp
    switch (noteResp?.type) {
      case "journal": {
        const value = DendronClientUtilsV2.genNoteName("JOURNAL");
        quickPick.value = value;
        await provider.onUpdatePickerItem(
          quickPick,
          provider.opts,
          "updatePickerBehavior:journal"
        );
        break;
      }
      case "scratch": {
        const value = DendronClientUtilsV2.genNoteName("SCRATCH");
        quickPick.value = value;
        await provider.onUpdatePickerItem(
          quickPick,
          provider.opts,
          "updatePickerBehavior:scratch"
        );
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
        await provider.onUpdatePickerItem(
          quickPick,
          provider.opts,
          "updatePickerBehavior:normal"
        );
    }
    // handle selection resp
    quickPick.onCreate = async (note: NotePropsV2) => {
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
              if (!selection.isEmpty) {
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

    // handle filter resp
    const before = quickPick.showDirectChildrenOnly;
    if (filterResp) {
      quickPick.showDirectChildrenOnly = true;
    } else {
      quickPick.showDirectChildrenOnly = false;
    }
    if (quickPick.showDirectChildrenOnly !== before) {
      Logger.info({ ctx, msg: "toggle showDirectChildOnly behavior" });
      await provider.onUpdatePickerItem(quickPick, provider.opts, "manual");
    }
  }
}
