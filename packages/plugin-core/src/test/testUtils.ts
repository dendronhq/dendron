import { NoteQuickInputV2 } from "@dendronhq/common-all";
import {
  HistoryEvent,
  HistoryEventAction,
  HistoryService,
} from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { DendronBtn } from "../components/lookup/ButtonTypes";
import { DendronQuickPickerV2 } from "../components/lookup/types";
import { VSCodeUtils } from "../vsCodeUtils";

export function getActiveEditorBasename() {
  return path.basename(
    VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath as string
  );
}

export function createMockConfig(settings: any): vscode.WorkspaceConfiguration {
  const _settings = settings;
  return {
    get: (_key: string) => {
      return _.get(_settings, _key);
    },
    update: async (_key: string, _value: any) => {
      _.set(_settings, _key, _value);
    },
    has: (key: string) => {
      return _.has(_settings, key);
    },
    inspect: (_section: string) => {
      return _settings;
    },
  };
}

type QuickPickOpts = Partial<{
  value: string;
  selectedItems: NoteQuickInputV2[];
  canSelectMany: boolean;
  buttons: DendronBtn[];
}>;

export function createMockQuickPick({
  value,
  selectedItems = [],
  canSelectMany,
  buttons,
}: QuickPickOpts): DendronQuickPickerV2 {
  const qp = vscode.window.createQuickPick<NoteQuickInputV2>();
  if (value) {
    qp.value = value;
  }
  qp.items = selectedItems;
  qp.selectedItems = selectedItems;
  qp.canSelectMany = canSelectMany || false;
  qp.buttons = buttons || [];
  return qp as DendronQuickPickerV2;
}

export function onWSInit(cb: Function) {
  HistoryService.instance().subscribe(
    "extension",
    async (_event: HistoryEvent) => {
      if (_event.action === "initialized") {
        await cb();
      }
    }
  );
}

export function onExtension({
  action,
  cb,
}: {
  action: HistoryEventAction;
  cb: Function;
}) {
  HistoryService.instance().subscribe(
    "extension",
    async (_event: HistoryEvent) => {
      if (_event.action === action) {
        await cb(_event);
      }
    }
  );
}

export function onWatcher({
  action,
  cb,
}: {
  action: HistoryEventAction;
  cb: Function;
}) {
  HistoryService.instance().subscribe(
    "watcher",
    async (_event: HistoryEvent) => {
      if (_event.action === action) {
        await cb();
      }
    }
  );
}
