import {
  DendronError,
  DEngineClientV2,
  DNodeProps,
  DNodePropsQuickInputV2,
  DNodeUtils,
  DNoteLoc,
  DVault,
  NoteProps,
  NoteQuickInput,
  NoteUtils,
  RespV2,
  VaultUtils,
} from "@dendronhq/common-all";
import { getDurationMilliseconds, vault2Path } from "@dendronhq/common-server";
import _ from "lodash";
import path from "path";
import { TextEditor, Uri, ViewColumn, window } from "vscode";
import { Logger } from "../../logger";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace, getWS } from "../../workspace";
import { DendronBtn, getButtonCategory } from "./buttons";
import {
  CREATE_NEW_DETAIL,
  CREATE_NEW_LABEL,
  MORE_RESULTS_LABEL,
} from "./constants";
import { ILookupProviderV3, OnAcceptHook } from "./LookupProviderV3";
import { DendronQuickPickerV2 } from "./types";

const PAGINATE_LIMIT = 50;
export const UPDATET_SOURCE = {
  UPDATE_PICKER_FILTER: "UPDATE_PICKER_FILTER",
};

export function createNoActiveItem(vault: DVault): DNodePropsQuickInputV2 {
  const props = DNodeUtils.create({
    fname: CREATE_NEW_LABEL,
    type: "note",
    vault,
  });
  return {
    ...props,
    label: CREATE_NEW_LABEL,
    detail: CREATE_NEW_DETAIL,
    alwaysShow: true,
  };
}

export function createMoreResults(): DNodePropsQuickInputV2 {
  // @ts-ignore
  return {
    label: MORE_RESULTS_LABEL,
    detail: "",
    alwaysShow: true,
  };
}

export function node2Uri(node: DNodeProps): Uri {
  const ext = node.type === "note" ? ".md" : ".yml";
  const nodePath = node.fname + ext;
  const wsRoot = DendronWorkspace.wsRoot();
  const vault = node.vault;
  const vpath = vault2Path({ wsRoot, vault });
  return Uri.file(path.join(vpath, nodePath));
}

export async function showDocAndHidePicker(
  uris: Uri[],
  picker: DendronQuickPickerV2
) {
  const ctx = "showDocAndHidePicker";
  const maybeSplitSelection = _.find(picker.buttons, (ent: DendronBtn) => {
    return getButtonCategory(ent) === "split" && ent.pressed;
  });
  let viewColumn = ViewColumn.Active;
  if (maybeSplitSelection) {
    const splitType = (maybeSplitSelection as DendronBtn).type;
    if (splitType === "horizontal") {
      viewColumn = ViewColumn.Beside;
    } else {
      // TODO: close current button
      // await commands.executeCommand("workbench.action.splitEditorDown");
    }
  }

  await Promise.all(
    uris.map(async (uri) => {
      return window.showTextDocument(uri, { viewColumn }).then(
        () => {
          Logger.info({ ctx, msg: "showTextDocument", fsPath: uri.fsPath });
          picker.hide();
          return;
        },
        (err) => {
          Logger.error({ ctx, err, msg: "exit" });
          throw err;
        }
      );
    })
  );
  return uris;
}

export type CreateQuickPickOpts = {
  title: string;
  placeholder: string;
  /**
   * QuickPick.ignoreFocusOut prop
   */
  ignoreFocusOut?: boolean;
  /**
   * Initial value for quickpick
   */
  initialValue?: string;
  nonInteractive?: boolean;
};

export type PrepareQuickPickOpts = CreateQuickPickOpts & {
  provider: ILookupProviderV3;
};

export type ShowQuickPickOpts = {
  quickpick: DendronQuickPickerV2;
  provider: ILookupProviderV3;
  nonInteractive?: boolean;
  fuzzThreshold?: number;
};

export type OldNewLocation = {
  oldLoc: DNoteLoc;
  newLoc: DNoteLoc & { note?: NoteProps };
};

export class ProviderAcceptHooks {
  /**
   * Returns current location and new location for note
   * @param param0
   * @returns
   */
  static oldNewLocationHook: OnAcceptHook = async ({
    quickpick,
    selectedItems,
  }): Promise<RespV2<OldNewLocation>> => {
    // setup vars
    const oldVault = PickerUtilsV2.getVaultForOpenEditor();
    const newVault = quickpick.vault ? quickpick.vault : oldVault;
    const wsRoot = DendronWorkspace.wsRoot();
    const ws = getWS();
    const engine = ws.getEngine();
    const notes = engine.notes;

    // get old note
    const editor = VSCodeUtils.getActiveTextEditor() as TextEditor;
    const oldUri: Uri = editor.document.uri;
    const oldFname = DNodeUtils.fname(oldUri.fsPath);

    const selectedItem = selectedItems[0];
    const fname = PickerUtilsV2.isCreateNewNotePickForSingle(selectedItem)
      ? quickpick.value
      : selectedItem.fname;

    // get new note
    let newNote = NoteUtils.getNoteByFnameV5({
      fname,
      notes,
      vault: newVault,
      wsRoot,
    });
    let isStub = newNote?.stub;
    if (newNote && !isStub) {
      const vaultName = VaultUtils.getName(newVault);
      const errMsg = `${vaultName}/${quickpick.value} exists`;
      window.showErrorMessage(errMsg);
      return {
        error: new DendronError({ msg: errMsg }),
      };
    }
    const data = {
      oldLoc: {
        fname: oldFname,
        vault: oldVault,
      },
      newLoc: {
        fname: quickpick.value,
        vault: newVault,
        note: newNote,
      },
    };
    return { data, error: null };
  };
}

export class PickerUtilsV2 {
  static createDefaultItems = ({
    picker,
    vault,
  }: {
    picker: DendronQuickPickerV2;
    vault: DVault;
  }) => {
    let out = [];
    if (_.find(picker.buttons, { type: "multiSelect" })?.pressed) {
      return [];
    } else {
      out.push(NotePickerUtils.createNoActiveItem(vault));
    }
    return out;
  };

  static createDendronQuickPick(opts: CreateQuickPickOpts) {
    const { title, placeholder, ignoreFocusOut, initialValue } = _.defaults(
      opts,
      {
        ignoreFocusOut: true,
      }
    );
    const quickPick = window.createQuickPick<
      DNodePropsQuickInputV2
    >() as DendronQuickPickerV2;
    quickPick.title = title;
    quickPick.nonInteractive = opts.nonInteractive;
    quickPick.placeholder = placeholder;
    quickPick.ignoreFocusOut = ignoreFocusOut;
    quickPick.justActivated = true;
    quickPick.canSelectMany = false;
    quickPick.matchOnDescription = false;
    quickPick.matchOnDetail = false;
    if (initialValue) {
      quickPick.value = initialValue;
    }
    return quickPick;
  }

  static createDendronQuickPickItem(
    opts: DNodePropsQuickInputV2
  ): DNodePropsQuickInputV2 {
    return {
      ...opts,
    };
  }

  static createDendronQuickPickItemFromNote(
    opts: NoteProps
  ): DNodePropsQuickInputV2 {
    return {
      ...opts,
      label: opts.fname,
    };
  }

  static dumpPicker(picker: DendronQuickPickerV2) {
    const activeItems = picker.activeItems.map((ent) =>
      NoteUtils.toLogObj(ent)
    );
    const selectedItems = picker.selectedItems.map((ent) =>
      NoteUtils.toLogObj(ent)
    );
    const value = picker.value;
    return { activeItems, selectedItems, value };
  }

  static getValue(picker: DendronQuickPickerV2) {
    return picker.value;
  }

  static getSelection(picker: DendronQuickPickerV2): DNodePropsQuickInputV2[] {
    return [...picker.selectedItems];
  }

  static filterCreateNewItem = (
    items: DNodePropsQuickInputV2[]
  ): DNodePropsQuickInputV2[] => {
    return _.reject(items, { label: CREATE_NEW_LABEL });
  };

  static filterDefaultItems = (
    items: DNodePropsQuickInputV2[]
  ): DNodePropsQuickInputV2[] => {
    return _.reject(
      items,
      (ent) =>
        ent.label === CREATE_NEW_LABEL || ent.label === MORE_RESULTS_LABEL
    );
  };

  /**
   * Reject all items that are over a given level
   * @param items
   * @param lvl
   */
  static filterByDepth = (
    items: DNodePropsQuickInputV2[],
    depth: number
  ): DNodePropsQuickInputV2[] => {
    return _.reject(items, (ent) => {
      return DNodeUtils.getDepth(ent) > depth;
    });
  };

  static getFnameForOpenEditor(): string | undefined {
    const activeEditor = VSCodeUtils.getActiveTextEditor();
    if (activeEditor) {
      return path.basename(activeEditor.document.fileName, ".md");
    }
    return;
  }

  /**
   * Defaults to first vault if current note is not part of a vault
   * @returns
   */
  static getVaultForOpenEditor(): DVault {
    const ctx = "getVaultForOpenEditor";
    const vaults = DendronWorkspace.instance().vaultsv4;
    let vault: DVault;
    const activeDocument = VSCodeUtils.getActiveTextEditor()?.document;
    if (
      activeDocument &&
      getWS().workspaceService?.isPathInWorkspace(activeDocument.uri.fsPath)
    ) {
      Logger.info({ ctx, activeDocument: activeDocument.fileName });
      vault = VaultUtils.getVaultByNotePathV4({
        vaults,
        wsRoot: DendronWorkspace.wsRoot(),
        fsPath: activeDocument.uri.fsPath,
      });
    } else {
      Logger.info({ ctx, msg: "no active doc" });
      vault = vaults[0];
    }
    // TODO: remove
    Logger.info({ ctx, msg: "exit", vault });
    return vault;
  }

  static getOrPromptVaultForOpenEditor(): DVault {
    return PickerUtilsV2.getVaultForOpenEditor();
  }

  static isCreateNewNotePickForSingle(node: DNodePropsQuickInputV2): boolean {
    if (!node) {
      return true;
    }
    if (node.detail === CREATE_NEW_DETAIL || node.stub || node.schemaStub) {
      return true;
    } else {
      return false;
    }
  }

  static isCreateNewNotePick(node: DNodePropsQuickInputV2): boolean {
    if (!node) {
      return true;
    }
    if (node.detail === CREATE_NEW_DETAIL || node.stub || node.schemaStub) {
      return true;
    } else {
      return false;
    }
  }

  static isStringInputEmpty(value?: string) {
    if (_.isUndefined(value)) {
      return true;
    }
    if (_.isEmpty(value)) {
      return true;
    }
    return false;
  }

  static promptVault(overrides?: DVault[]): Promise<DVault | undefined> {
    const vaults = overrides ? overrides : DendronWorkspace.instance().vaultsv4;
    const items = vaults.map((ent) => ({
      ...ent,
      label: ent.fsPath,
    }));
    const resp = VSCodeUtils.showQuickPick(items) as Promise<
      DVault | undefined
    >;
    return resp;
  }

  static refreshButtons(opts: {
    quickpick: DendronQuickPickerV2;
    buttons: DendronBtn[];
    buttonsPrev: DendronBtn[];
  }) {
    opts.buttonsPrev = opts.quickpick.buttons.map((b: DendronBtn) => b.clone());
    opts.quickpick.buttons = opts.buttons;
  }

  /**
   * Toggle all button enablement effects
   * @param opts
   */
  static async refreshPickerBehavior(opts: {
    quickpick: DendronQuickPickerV2;
    buttons: DendronBtn[];
  }) {
    const buttonsEnabled = _.filter(opts.buttons, { pressed: true });
    const buttonsDisabled = _.filter(opts.buttons, { pressed: false });
    await Promise.all(
      buttonsEnabled.map((bt) => {
        bt.onEnable({ quickPick: opts.quickpick });
      })
    );
    await Promise.all(
      buttonsDisabled.map((bt) => {
        bt.onDisable({ quickPick: opts.quickpick });
      })
    );
  }

  static resetPaginationOpts(picker: DendronQuickPickerV2) {
    delete picker.moreResults;
    delete picker.offset;
    delete picker.allResults;
  }

  static slashToDot(ent: string) {
    return ent.replace(/\//g, ".");
  }
}

export class NotePickerUtils {
  static createNoActiveItem(vault: DVault): DNodePropsQuickInputV2 {
    const props = DNodeUtils.create({
      fname: CREATE_NEW_LABEL,
      type: "note",
      vault,
    });
    return {
      ...props,
      label: CREATE_NEW_LABEL,
      detail: CREATE_NEW_DETAIL,
      alwaysShow: true,
    };
  }

  static getSelection(picker: DendronQuickPickerV2): NoteQuickInput[] {
    return [...picker.selectedItems];
  }

  static fetchRootResults = (opts: { engine: DEngineClientV2 }) => {
    const { engine } = opts;
    const nodeDict = engine.notes;
    const roots = NoteUtils.getRoots(nodeDict);
    const childrenOfRoot = roots.flatMap((ent) => ent.children);
    const nodes = _.map(childrenOfRoot, (ent) => nodeDict[ent]).concat(roots);
    return nodes.map((ent) => {
      return DNodeUtils.enhancePropForQuickInput({
        wsRoot: DendronWorkspace.wsRoot(),
        props: ent,
        schemas: engine.schemas,
        vaults: DendronWorkspace.instance().vaultsv4,
      });
    });
  };

  static async fetchPickerResults(opts: {
    picker: DendronQuickPickerV2;
    qs: string;
  }) {
    const ctx = "createPickerItemsFromEngine";
    const start = process.hrtime();
    const { picker, qs } = opts;
    const engine = getWS().getEngine();
    Logger.info({ ctx, msg: "first query" });
    let nodes: NoteProps[];
    // if we are doing a query, reset pagination options
    PickerUtilsV2.resetPaginationOpts(picker);
    const resp = await engine.queryNotes({ qs });
    nodes = resp.data;
    Logger.info({ ctx, msg: "post:queryNotes" });
    if (nodes.length > PAGINATE_LIMIT) {
      picker.allResults = nodes;
      picker.offset = PAGINATE_LIMIT;
      picker.moreResults = true;
      nodes = nodes.slice(0, PAGINATE_LIMIT);
    } else {
      PickerUtilsV2.resetPaginationOpts(picker);
    }
    const updatedItems = await Promise.all(
      nodes.map(async (ent) =>
        DNodeUtils.enhancePropForQuickInput({
          wsRoot: DendronWorkspace.wsRoot(),
          props: ent,
          schemas: engine.schemas,
          vaults: DendronWorkspace.instance().vaultsv4,
        })
      )
    );
    const profile = getDurationMilliseconds(start);
    Logger.info({ ctx, msg: "engine.query", profile });
    return updatedItems;
  }
}
