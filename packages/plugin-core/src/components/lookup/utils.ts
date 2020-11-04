import {
  DNodePropsQuickInputV2,
  DNodePropsV2,
  DNodeUtilsV2,
} from "@dendronhq/common-all";
import _ from "lodash";
import path from "path";
import { Uri, ViewColumn, window, WorkspaceFolder } from "vscode";
import { Logger } from "../../logger";
import { DendronBtn, getButtonCategory } from "./buttons";
import { CREATE_NEW_DETAIL, CREATE_NEW_LABEL } from "./constants";
import { DendronQuickPickerV2 } from "./types";

export function createNoActiveItem(): DNodePropsQuickInputV2 {
  const props = DNodeUtilsV2.create({ fname: CREATE_NEW_LABEL, type: "note" });
  return {
    ...props,
    label: CREATE_NEW_LABEL,
    detail: CREATE_NEW_DETAIL,
    alwaysShow: true,
  };
}

export function node2Uri(
  node: DNodePropsV2,
  workspaceFolders: WorkspaceFolder[]
): Uri {
  const ext = node.type === "note" ? ".md" : ".yml";
  const nodePath = node.fname + ext;
  const rootWs = workspaceFolders[0];
  const rootPath = rootWs.uri.path;
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

  return Promise.all(
    uris.map(async (uri) => {
      return window.showTextDocument(uri, { viewColumn }).then(
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
}

export class PickerUtilsV2 {
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
