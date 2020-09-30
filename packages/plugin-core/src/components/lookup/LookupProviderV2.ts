import {
  DEngine,
  DEngineV2,
  DNode,
  DNodePropsDictV2,
  DNodePropsQuickInputV2,
  DNodePropsV2,
  DNodeUtils,
  DNodeUtilsV2,
  Note,
  NoteUtilsV2,
  Schema,
  SchemaUtils,
  SchemaUtilsV2,
} from "@dendronhq/common-all";
import { DendronEngine } from "@dendronhq/engine-server/src";
import _ from "lodash";
import { QuickPick, QuickPickItem, Uri, window, WorkspaceFolder } from "vscode";
import { Logger } from "../../logger";
import { HistoryService } from "../../services/HistoryService";
import { getDurationMilliseconds, profile } from "../../utils/system";
import { DendronWorkspace } from "../../workspace";
import { CREATE_NEW_DETAIL } from "./constants";
import {
  DendronQuickPickerV2,
  EngineFlavor,
  EngineOpts,
  PickerUtils,
} from "./LookupProvider";
import {
  createNoActiveItem,
  node2Uri,
  PickerUtilsV2,
  showDocAndHidePicker,
} from "./utils";

export class LookupProviderV2 {
  public opts: EngineOpts;
  public noActiveItem: DNodePropsQuickInputV2;

  constructor(opts: EngineOpts) {
    this.noActiveItem = createNoActiveItem();
    this.opts = opts;
  }

  async onAcceptNewNode(
    picker: DendronQuickPickerV2,
    opts: EngineOpts
  ): Promise<Uri> {
    const ctx = "onAcceptNewNode";
    Logger.info({ ctx, msg: "createNewPick" });
    const fname = PickerUtils.getValue(picker);
    const selectedItem = PickerUtilsV2.getSelection(picker);
    let nodeNew: DNodePropsV2;
    let foundStub = false;
    const ws = DendronWorkspace.instance();
    const wsFolders = DendronWorkspace.workspaceFolders() as WorkspaceFolder[];
    const engine = ws.getEngine();
    if (_.isUndefined(selectedItem)) {
      Logger.info({ ctx, msg: "create normal node" });
      nodeNew =
        opts.flavor === "note"
          ? NoteUtilsV2.create({ fname })
          : SchemaUtilsV2.create({ fname });
    } else if (selectedItem.stub) {
      Logger.info({ ctx, msg: "create stub" });
      nodeNew = engine.notes[selectedItem.id];
      nodeNew.stub = false;
      foundStub = true;
    } else if (selectedItem.schemaStub) {
      Logger.info({ ctx, msg: "create schema stub" });
      nodeNew = selectedItem;
    } else {
      Logger.info({ ctx, msg: "create from label" });
      // TODO: isn't this the same as undefined?
      nodeNew =
        opts.flavor === "note"
          ? NoteUtilsV2.create({ fname })
          : SchemaUtilsV2.create({ fname });
    }

    // TODO: apply schema
    const uri = node2Uri(nodeNew, wsFolders);
    const historyService = HistoryService.instance();
    historyService.add({ source: "engine", action: "create", uri });
    const noteExists = DNodeUtilsV2.getNoteByFname(nodeNew.fname, engine);
    if (noteExists && !foundStub && !selectedItem.schemaStub) {
      Logger.error({ ctx, msg: "action will overwrite existing note" });
      throw Error("action will overwrite existing note");
    }
    if (opts.flavor === "note") {
      if (picker.onCreate) {
        await picker.onCreate(nodeNew);
      }
    }
    // TODO: write negine
    //   await engine.write(nodeNew, {
    //     newNode: true,
    //     parentsAsStubs: true,
    //   });
    Logger.info({ ctx, msg: "engine.write", profile });
    return uri;
  }

  async onDidAccept(picker: DendronQuickPickerV2, opts: EngineOpts) {
    const ctx = "onDidAccept";
    const value = PickerUtils.getValue(picker);
    Logger.info({ ctx, msg: "enter", value, opts });
    const selectedItem = PickerUtilsV2.getSelection(picker);
    const resp = this.validate(picker.value, opts.flavor);
    const wsFolders = DendronWorkspace.workspaceFolders() as WorkspaceFolder[];
    let uri: Uri;
    if (resp) {
      return window.showErrorMessage(resp);
    }
    if (PickerUtilsV2.isCreateNewNotePick(selectedItem)) {
      uri = await this.onAcceptNewNode(picker, opts);
    } else {
      uri = node2Uri(selectedItem, wsFolders);
    }
    return showDocAndHidePicker(uri, picker);
  }

  async onUpdatePickerItem(
    picker: DendronQuickPickerV2,
    opts: EngineOpts,
    source:
      | "updatePickerBehavior:journal"
      | "updatePickerBehavior:scratch"
      | "updatePickerBehavior:normal"
      | "onValueChange"
      | "manual"
  ) {
    const start = process.hrtime();
    const ctx = "updatePickerItems";
    picker.busy = true;

    let pickerValue = picker.value;

    // if we just started, show all results of current parent
    if (picker.justActivated) {
      const lastDotIndex = pickerValue.lastIndexOf(".");
      if (lastDotIndex < 0) {
        pickerValue = "";
      } else {
        pickerValue = pickerValue.slice(0, lastDotIndex + 1);
      }
    }
    const querystring = PickerUtilsV2.slashToDot(pickerValue);
    const queryOrig = PickerUtilsV2.slashToDot(picker.value);
    const ws = DendronWorkspace.instance();
    let profile: number;
    const queryEndsWithDot = queryOrig.endsWith(".");
    const engine = ws.getEngine();
    Logger.info({ ctx, msg: "enter", queryOrig, source });
    try {
      if (querystring === "") {
        Logger.info({ ctx, msg: "empty qs" });
        picker.items = this.showRootResults(opts.flavor, engine);
        return;
      }

      // current items
      const items: DNodePropsQuickInputV2[] = [...picker.items];

      let updatedItems = PickerUtilsV2.filterCreateNewItem(items);
      updatedItems = [this.noActiveItem].concat(updatedItems);
      Logger.info({
        ctx,
        pickerValue,
        items: updatedItems.map((ent) => _.pick(ent, ["id", "title"])),
        msg: "qs",
      });

      // first query, show all results
      // subsequent query, only show next level children
      if (
        queryEndsWithDot ||
        queryOrig.split(".").length < 2 ||
        picker.justActivated
      ) {
        Logger.info({ ctx, msg: "first query" });
        const resp = await engine.query(querystring, opts.flavor);
        const notes = resp.data;
        updatedItems = [this.noActiveItem].concat(
          notes.map((ent) =>
            DNodeUtilsV2.enhancePropForQuickInput(NoteUtilsV2.create(ent))
          )
        );
        profile = getDurationMilliseconds(start);
        Logger.info({ ctx, msg: "engine.query", profile });
      }
      return;
    } catch (err) {
      throw Error(err);
    } finally {
      profile = getDurationMilliseconds(start);
      picker.busy = false;
      picker.justActivated = false;
      Logger.info({ ctx, msg: "exit", queryOrig, source, profile });
    }
  }

  provide(picker: DendronQuickPickerV2) {
    const { opts } = this;
    picker.onDidAccept(async () => {
      this.onDidAccept(picker, opts);
    });
    picker.onDidChangeValue(() => {
      this.onUpdatePickerItem(picker, opts, "onValueChange");
    });
  }

  showRootResults(
    flavor: EngineFlavor,
    engine: DEngineV2
  ): DNodePropsQuickInputV2[] {
    let nodeDict: DNodePropsDictV2;
    if (flavor === "note") {
      nodeDict = engine.notes;
    } else {
      nodeDict = engine.schemas;
    }
    return DNodeUtilsV2.enhancePropsForQuickInput(
      _.map(nodeDict["root"].children, (ent) => nodeDict[ent]).concat(
        nodeDict["root"]
      )
    );
  }

  validate(value: string, flavor: EngineFlavor): string | undefined {
    if (flavor === "schema") {
      if (value.split(".").length > 1) {
        return "schemas can only be one level deep";
      }
    }
    return;
  }
}
