import {
  DendronError,
  DNodePropsQuickInputV2,
  getSlugger,
  NoteProps,
} from "@dendronhq/common-all";
import { getDurationMilliseconds } from "@dendronhq/common-server";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { QuickInputButton } from "vscode";
import { CancellationTokenSource } from "vscode-languageclient";
import {
  LookupCommandOpts,
  LookupNoteExistBehavior,
  VaultSelectionMode,
} from "../../commands/LookupCommand";
import { CONFIG } from "../../constants";
import { Logger } from "../../logger";
import { EngineOpts } from "../../types";
import { DendronClientUtilsV2, VSCodeUtils } from "../../utils";
import { DendronWorkspace, getWS } from "../../workspace";
import {
  ButtonCategory,
  ButtonType,
  createAllButtons,
  DendronBtn,
  getButtonCategory,
  IDendronQuickInputButton,
} from "./buttons";
import { LookupProviderV2 } from "./LookupProviderV2";
import { DendronQuickPickerV2, LookupControllerState } from "./types";
import { PickerUtilsV2, UPDATET_SOURCE } from "./utils";

export class LookupControllerV2 {
  public quickPick?: DendronQuickPickerV2;
  public state: LookupControllerState;
  public provider?: LookupProviderV2;
  protected opts: EngineOpts;
  protected _onDidHide?: () => void;
  protected _cancelTokenSource?: CancellationTokenSource;
  private vaultSelectionMode?: VaultSelectionMode;

  constructor(
    opts: EngineOpts,
    lookupOpts?: Omit<LookupCommandOpts, "flavor">
  ) {
    // selection behaior
    const lookupSelectionType =
      lookupOpts?.selectionType ||
      (DendronWorkspace.configuration().get<string>(
        CONFIG.DEFAULT_LOOKUP_CREATE_BEHAVIOR.key
      ) as ButtonType);
    const noteSelectionType = lookupOpts?.noteType;
    const initialTypes = _.isUndefined(lookupSelectionType)
      ? []
      : [lookupSelectionType];
    if (noteSelectionType) {
      initialTypes.push(noteSelectionType);
    }
    if (lookupOpts?.effectType) {
      initialTypes.push(lookupOpts.effectType);
    }

    // initialize rest
    this.state = {
      buttons: opts.flavor === "note" ? createAllButtons(initialTypes) : [],
      buttonsPrev: [],
    };
    this.opts = opts;
    this.createCancelSource();

    this.vaultSelectionMode = lookupOpts?.vaultSelectionMode;
  }

  get cancelToken() {
    if (_.isUndefined(this._cancelTokenSource)) {
      throw new DendronError({ message: "no cancel token" });
    }
    return this._cancelTokenSource;
  }

  createCancelSource() {
    const tokenSource = new CancellationTokenSource();
    if (this._cancelTokenSource) {
      this._cancelTokenSource.cancel();
      this._cancelTokenSource.dispose();
    }
    this._cancelTokenSource = tokenSource;
    return tokenSource;
  }

  // exposed for testing
  onDidHide = (cb: () => void) => {
    this._onDidHide = cb;
  };

  onTriggerButton = async (btn: QuickInputButton) => {
    const quickPick = this.quickPick;
    const provider = this.provider;
    if (!quickPick || !provider) {
      return;
    }
    const resp = await VSCodeUtils.extractRangeFromActiveEditor();
    const { document, range } = resp || {};
    const btnType = (btn as IDendronQuickInputButton).type;

    const btnTriggered = _.find(this.state.buttons, {
      type: btnType,
    }) as DendronBtn;
    if (!btnTriggered) {
      throw Error("bad button type");
    }
    btnTriggered.pressed = !btnTriggered.pressed;
    const btnCategory = getButtonCategory(btnTriggered);
    // toggle other buttons in same category off
    if (!_.includes(["effect"] as ButtonCategory[], btnCategory)) {
      _.filter(this.state.buttons, (ent) => ent.type !== btnTriggered.type).map(
        (ent) => {
          if (getButtonCategory(ent) === btnCategory) {
            ent.pressed = false;
          }
        }
      );
    }

    this.refreshButtons(quickPick, this.state.buttons);
    await this.updatePickerBehavior({
      quickPick,
      document,
      range,
      provider,
      changed: btnTriggered,
      vaultSelectionMode: this.vaultSelectionMode,
    });
  };

  refreshButtons(quickpick: DendronQuickPickerV2, buttons: DendronBtn[]) {
    this.state.buttonsPrev = quickpick.buttons.map((b: DendronBtn) =>
      b.clone()
    );
    quickpick.buttons = buttons;
  }

  async show(opts?: {
    value?: string;
    ignoreFocusOut?: boolean;
    document?: vscode.TextDocument;
    range?: vscode.Range;
    noConfirm?: boolean;
    noteExistBehavior?: LookupNoteExistBehavior;
  }) {
    let profile;
    const start = process.hrtime();
    const ctx = "LookupControllerV2:show";
    const cleanOpts = _.defaults(opts, {
      ignoreFocusOut: true,
    });
    const { document, range } = cleanOpts;
    Logger.info({ ctx, msg: "enter", cleanOpts });
    // create quick pick
    const quickPick =
      vscode.window.createQuickPick<DNodePropsQuickInputV2>() as DendronQuickPickerV2;
    const title = [`Lookup (${this.opts.flavor})`];
    title.push(`- version: ${DendronWorkspace.version()}`);
    quickPick.title = title.join(" ");
    quickPick.placeholder = "eg. hello.world";
    quickPick.ignoreFocusOut = cleanOpts.ignoreFocusOut;
    quickPick._justActivated = !opts?.noConfirm;
    quickPick.canSelectMany = false;
    quickPick.matchOnDescription = false;
    quickPick.matchOnDetail = false;

    profile = getDurationMilliseconds(start);
    const cancelToken = this.createCancelSource();
    Logger.info({ ctx, profile, msg: "post:createQuickPick" });

    const provider = new LookupProviderV2(this.opts);
    this.provider = provider;

    profile = getDurationMilliseconds(start);
    Logger.info({ ctx, profile, msg: "post:createProvider" });

    this.refreshButtons(quickPick, this.state.buttons);
    await this.updatePickerBehavior({
      quickPick,
      document,
      range,
      quickPickValue: cleanOpts.value,
      provider,
      vaultSelectionMode: this.vaultSelectionMode,
    });
    Logger.info({ ctx, profile, msg: "post:updatePickerBehavior" });
    quickPick.onDidTriggerButton(this.onTriggerButton);

    // cleanup quickpick
    quickPick.onDidHide(() => {
      quickPick.dispose();
      this.quickPick = undefined;
      this.cancelToken?.dispose();
      if (this._onDidHide) {
        this._onDidHide();
      }
    });

    provider.provide({ picker: quickPick, lc: this });
    Logger.info({ ctx, profile, msg: "post:provide" });
    if (opts?.noConfirm) {
      await provider.onUpdatePickerItem(
        quickPick,
        this.opts,
        "manual",
        cancelToken.token
      );
      // would be empty if not set
      quickPick.selectedItems = quickPick.items;
      // FIXME: used for testing
      if (quickPick.value && _.isEmpty(quickPick.items)) {
        const items = provider.createDefaultItems({ picker: quickPick });
        quickPick.items = items;
        quickPick.selectedItems = items;
      }
      await provider.onDidAccept({
        picker: quickPick,
        opts: { flavor: this.opts.flavor },
        lc: this,
      });
    } else {
      quickPick.show();
    }
    this.quickPick = quickPick;
    Logger.info({ ctx, profile, msg: "exit" });
    return quickPick;
  }

  async updateBehaviorByNoteType({
    noteResp,
    quickPick,
    provider,
    quickPickValue,
  }: {
    noteResp?: DendronBtn;
    quickPick: DendronQuickPickerV2;
    provider: LookupProviderV2;
    quickPickValue?: string;
  }) {
    const { selection, text } = VSCodeUtils.getSelection();
    const buttons = this.state.buttons;
    let suffix: string | undefined;

    if (
      !_.isEmpty(selection) &&
      !_.isUndefined(text) &&
      !_.isEmpty(text) &&
      _.find(_.filter(buttons, { pressed: true }), {
        type: "selection2link",
      }) &&
      DendronWorkspace.configuration().get<string>(
        CONFIG.LINK_SELECT_AUTO_TITLE_BEHAVIOR.key
      ) === "slug"
    ) {
      const slugger = getSlugger();
      suffix = slugger.slug(text);
    }
    let onUpdateReason: any = "updatePickerBehavior:normal";
    let onUpdateValue: string;

    switch (noteResp?.type) {
      case "journal": {
        const { noteName } = DendronClientUtilsV2.genNoteName("JOURNAL", {
          overrides: { domain: quickPickValue },
        });
        onUpdateValue = noteName;
        onUpdateReason = "updatePickerBehavior:journal";
        break;
      }
      case "scratch": {
        const { noteName } = DendronClientUtilsV2.genNoteName("SCRATCH", {
          overrides: { domain: quickPickValue },
        });
        onUpdateValue = noteName;
        onUpdateReason = "updatePickerBehavior:scratch";
        break;
      }
      default:
        if (quickPickValue !== undefined) {
          onUpdateValue = quickPickValue;
        } else {
          const editorPath =
            vscode.window.activeTextEditor?.document.uri.fsPath;
          if (editorPath && this.opts.flavor !== "schema") {
            onUpdateValue = path.basename(editorPath, ".md");
          } else {
            onUpdateValue = "";
          }
        }
        onUpdateReason = "updatePickerBehavior:normal";
    }
    if (!_.isUndefined(suffix)) {
      onUpdateValue = [onUpdateValue, suffix].join(".");
    }
    quickPick.value = onUpdateValue;
    const tokenSource = this.createCancelSource();
    await provider.onUpdatePickerItem(
      quickPick,
      provider.opts,
      onUpdateReason,
      tokenSource.token
    );
  }

  async updateBehaviorByEffect({
    quickPick,
  }: {
    quickPick: DendronQuickPickerV2;
  }) {
    const effectResp = _.filter(
      quickPick.buttons,
      (ent) => getButtonCategory(ent) === "effect"
    );
    await Promise.all(
      effectResp.map(async (effect) => {
        return effect.onEnable({ quickPick });
      })
    );
  }

  async updatePickerBehavior(opts: {
    quickPick: DendronQuickPickerV2;
    document?: vscode.TextDocument;
    range?: vscode.Range;
    quickPickValue?: string;
    provider: LookupProviderV2;
    changed?: DendronBtn;
    vaultSelectionMode?: VaultSelectionMode;
  }) {
    const ctx = "updatePickerBehavior";
    const ws = getWS();
    const { document, range, quickPick, quickPickValue, provider, changed } =
      opts;
    const buttons = this.state.buttons;
    // get all pressed buttons
    const resp = _.filter(buttons, { pressed: true });
    Logger.info({ ctx, activeButtons: resp });
    const noteResp = _.find(resp, (ent) => getButtonCategory(ent) === "note");
    // collect info
    const selectionResp = _.find(
      resp,
      (ent) => getButtonCategory(ent) === "selection"
    );
    const filterResp = _.find(
      resp,
      (ent) => getButtonCategory(ent) === "filter"
    );
    const selection2LinkChanged = changed?.type === "selection2link";

    // handle effect resp
    await this.updateBehaviorByEffect({ quickPick });

    // handle note resp, requires updating picker value
    if (
      !changed ||
      (changed && getButtonCategory(changed) === "note") ||
      selection2LinkChanged
    ) {
      this.updateBehaviorByNoteType({
        noteResp,
        quickPick,
        provider,
        quickPickValue,
      });
    }

    // handle selection resp
    quickPick.onCreate = async (note: NoteProps) => {
      const vaultSelection = await PickerUtilsV2.getOrPromptVaultForNewNote({
        vault: note.vault,
        fname: note.fname,
        vaultSelectionMode: opts.vaultSelectionMode,
      });

      if (_.isUndefined(vaultSelection)) {
        vscode.window.showInformationMessage("Note creation cancelled");
        return undefined;
      }
      note.vault = vaultSelection;

      switch (selectionResp?.type) {
        case "selectionExtract": {
          if (!_.isUndefined(document)) {
            const body = "\n" + document.getText(range).trim();
            note.body = body;
            // don't delete if original file is not in workspace
            if (!ws.workspaceService?.isPathInWorkspace(document.uri.fsPath)) {
              return note;
            }
            await VSCodeUtils.deleteRange(document, range as vscode.Range);
          }
          return note;
        }
        case "selection2link": {
          if (!_.isUndefined(document)) {
            const editor = VSCodeUtils.getActiveTextEditor();
            const { selection, text } = VSCodeUtils.getSelection();
            await editor?.edit((builder) => {
              const link = note.fname;
              if (!_.isUndefined(selection) && !selection.isEmpty) {
                builder.replace(selection, `[[${text}|${link}]]`);
              }
            });
          }
          return note;
        }
        default: {
          quickPick.onCreate = async () => {
            return undefined;
          };
          return undefined;
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
    if (!_.isUndefined(before) && quickPick.showDirectChildrenOnly !== before) {
      Logger.info({ ctx, msg: "toggle showDirectChildOnly behavior" });
      const tokenSource = this.createCancelSource();
      await provider.onUpdatePickerItem(
        quickPick,
        provider.opts,
        UPDATET_SOURCE.UPDATE_PICKER_FILTER,
        tokenSource.token
      );
    }
  }
}
