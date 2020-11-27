import {
  DNodePropsQuickInputV2,
  DNodePropsV2,
  DNodeUtilsV2,
  DVault,
  NoteUtilsV2,
} from "@dendronhq/common-all";
import _ from "lodash";
import path from "path";
import { Uri, ViewColumn, window } from "vscode";
import { Logger } from "../../logger";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { DendronBtn, getButtonCategory } from "./buttons";
import { CREATE_NEW_DETAIL, CREATE_NEW_LABEL } from "./constants";
import { DendronQuickPickerV2 } from "./types";

export const UPDATET_SOURCE = {
  UPDATE_PICKER_FILTER: "UPDATE_PICKER_FILTER",
};

export function createNoActiveItem(vault: DVault): DNodePropsQuickInputV2 {
  const props = DNodeUtilsV2.create({
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

export function node2Uri(node: DNodePropsV2): Uri {
  const ext = node.type === "note" ? ".md" : ".yml";
  const nodePath = node.fname + ext;
  const rootPath = node.vault.fsPath;
  return Uri.file(path.join(rootPath, nodePath));
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
      window.showTextDocument(uri, { viewColumn }).then(
        () => {
          Logger.info({ ctx, msg: "showTextDocument" });
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

export class PickerUtilsV2 {
  static dumpPicker(picker: DendronQuickPickerV2) {
    const activeItems = picker.activeItems.map((ent) =>
      NoteUtilsV2.toLogObj(ent)
    );
    const selectedItems = picker.selectedItems.map((ent) =>
      NoteUtilsV2.toLogObj(ent)
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
      return DNodeUtilsV2.getDepth(ent) > depth;
    });
  };

  static getVaultForOpenEditor(opts?: { throwIfEmpty: boolean }): DVault {
    const vaults = DendronWorkspace.instance().vaults;
    let vault: DVault;
    if (vaults.length > 1 && VSCodeUtils.getActiveTextEditor()?.document) {
      try {
        vault = DNodeUtilsV2.getVaultByDir({
          vaults,
          dirPath: path.dirname(
            VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath as string
          ),
        });
      } catch (err) {
        if (opts?.throwIfEmpty) {
          throw err;
        }
        return vaults[0];
      }
    } else {
      vault = vaults[0];
    }
    return vault;
  }

  static getOrPromptVaultForOpenEditor(): DVault {
    try {
      return PickerUtilsV2.getVaultForOpenEditor();
    } catch (err) {
      throw err;
      // TODO
    }
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

  static slashToDot(ent: string) {
    return ent.replace(/\//g, ".");
  }
}
