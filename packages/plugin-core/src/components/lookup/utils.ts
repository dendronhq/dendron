import {
  DNodePropsQuickInputV2,
  DNodeProps,
  DNodeUtils,
  DVault,
  NoteProps,
  NoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import _ from "lodash";
import path from "path";
import { Uri, ViewColumn, window } from "vscode";
import { Logger } from "../../logger";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace, getWS } from "../../workspace";
import { DendronBtn, getButtonCategory } from "./buttons";
import {
  CREATE_NEW_DETAIL,
  CREATE_NEW_LABEL,
  MORE_RESULTS_LABEL,
} from "./constants";
import { DendronQuickPickerV2 } from "./types";

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
  ignoreFocusOut?: boolean;
};

export class PickerUtilsV2 {
  static createDendronQuickPick(opts: CreateQuickPickOpts) {
    const { title, placeholder, ignoreFocusOut } = _.defaults(opts, {
      ignoreFocusOut: true,
    });
    const quickPick = window.createQuickPick<
      DNodePropsQuickInputV2
    >() as DendronQuickPickerV2;
    quickPick.title = title;
    quickPick.placeholder = placeholder;
    quickPick.ignoreFocusOut = ignoreFocusOut;
    quickPick.justActivated = true;
    quickPick.canSelectMany = false;
    quickPick.matchOnDescription = false;
    quickPick.matchOnDetail = false;
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

  static promptVault(): Promise<DVault | undefined> {
    const items = DendronWorkspace.instance().vaultsv4.map((ent) => ({
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

  static async refreshPickerBehavior(opts: {
    quickpick: DendronQuickPickerV2;
    buttons: DendronBtn[];
  }) {
    const resp = _.filter(opts.buttons, { pressed: true });
    return Promise.all(
      resp.map((bt) => {
        bt.handle({ quickPick: opts.quickpick });
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
