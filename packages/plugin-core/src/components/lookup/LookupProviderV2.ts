import {
  DEngineClientV2,
  DNodePropsDictV2,
  DNodePropsQuickInputV2,
  DNodePropsV2,
  DNodeUtilsV2,
  NotePropsV2,
  NoteUtilsV2,
  SchemaUtilsV2,
} from "@dendronhq/common-all";
import _ from "lodash";
import { Uri, window, WorkspaceFolder } from "vscode";
import { Logger } from "../../logger";
import { HistoryService } from "../../services/HistoryService";
import { getDurationMilliseconds, profile } from "../../utils/system";
import { DendronWorkspace } from "../../workspace";
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
    const fname = PickerUtils.getValue(picker);
    Logger.info({ ctx, msg: "createNewPick", value: fname });
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
          : SchemaUtilsV2.create({ id: fname, fname });
    } else if (selectedItem.stub) {
      Logger.info({ ctx, msg: "create stub" });
      nodeNew = engine.notes[selectedItem.id];
      nodeNew.stub = false;
      foundStub = true;
    } else if (selectedItem.schemaStub) {
      Logger.info({ ctx, msg: "create schema stub" });
      selectedItem.schemaStub = false;
      nodeNew = selectedItem;
    } else {
      Logger.info({ ctx, msg: "create from label" });
      // TODO: isn't this the same as undefined?
      nodeNew =
        opts.flavor === "note"
          ? NoteUtilsV2.create({ fname })
          : SchemaUtilsV2.create({ id: fname, fname });
    }

    // TODO: apply schema
    const uri = node2Uri(nodeNew, wsFolders);
    const historyService = HistoryService.instance();
    historyService.add({ source: "engine", action: "create", uri });
    const noteExists = NoteUtilsV2.getNoteByFname(nodeNew.fname, engine.notes);
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
    await engine.writeNote(nodeNew, {
      newNode: true,
    });
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
    // ~~~ setup variables
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

    // ~~~ update results
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
            DNodeUtilsV2.enhancePropForQuickInput(ent, engine.schemas)
          )
        );
        profile = getDurationMilliseconds(start);
        Logger.info({ ctx, msg: "engine.query", profile });
      }

      // check if single item query, vscode doesn't surface single letter queries
      if (picker.activeItems.length === 0 && querystring.length === 1) {
        picker.items = updatedItems;
        picker.activeItems = picker.items;
        return;
      }

      // don't use query string since this can change
      const perfectMatch = _.find(updatedItems, { fname: queryOrig });
      // NOTE: we modify this later so need to track this here
      const noUpdatedItems = updatedItems.length === 0;

      // add schema suggestions
      if (opts.flavor === "note" && queryEndsWithDot) {
        const results = SchemaUtilsV2.matchPath({
          notePath: _.trimEnd(queryOrig, "."),
          schemaModDict: engine.schemas,
        });
        // since namespace matches everything, we don't do queries on that
        if (results && !results.schema.data.namespace) {
          const { schema, schemaModule } = results;
          const dirName = DNodeUtilsV2.dirName(queryOrig);
          const candidates = schema.children
            .map((ent) => {
              const mschema = schemaModule.schemas[ent];
              if (SchemaUtilsV2.hasSimplePattern(mschema)) {
                const pattern = SchemaUtilsV2.getPattern(mschema);
                const fname = [dirName, pattern].join(".");
                return NoteUtilsV2.create({
                  fname,
                  schemaStub: true,
                  desc: mschema.desc,
                  schema: {
                    moduleId: schemaModule.root.id,
                    schemaId: schema.id,
                  },
                });
              }
              return;
            })
            .filter(Boolean) as NotePropsV2[];
          const candidatesToAdd = _.differenceBy(
            candidates,
            updatedItems,
            (ent) => ent.fname
          );
          updatedItems = updatedItems.concat(
            candidatesToAdd.map((ent) => {
              return DNodeUtilsV2.enhancePropForQuickInput(ent, engine.schemas);
            })
          );
        }
      }
      // check if new item, return if that's the case
      if (
        noUpdatedItems ||
        (picker.activeItems.length === 0 && !perfectMatch && !queryEndsWithDot)
      ) {
        Logger.info({ ctx, msg: "no matches" });
        picker.items = updatedItems;
        return;
      }

      if (perfectMatch) {
        Logger.debug({ ctx, msg: "active = qs" });
        picker.activeItems = [perfectMatch];
        picker.items = PickerUtilsV2.filterCreateNewItem(updatedItems);
      } else if (queryEndsWithDot) {
        // don't show noActiveItem for dot queries
        Logger.debug({ ctx, msg: "active != qs, end with ." });
        picker.items = PickerUtilsV2.filterCreateNewItem(updatedItems);
      } else {
        // regular result
        Logger.debug({ ctx, msg: "active != qs" });
        picker.items = updatedItems;
      }
    } catch (err) {
      throw Error(err);
    } finally {
      profile = getDurationMilliseconds(start);
      picker.busy = false;
      picker.justActivated = false;
      Logger.info({ ctx, msg: "exit", queryOrig, source, profile, picker });
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
    engine: DEngineClientV2
  ): DNodePropsQuickInputV2[] {
    let nodeDict: DNodePropsDictV2;
    if (flavor === "note") {
      nodeDict = engine.notes;
    } else {
      nodeDict = _.mapValues(engine.schemas, (ent) => ent.root);
    }
    return _.map(nodeDict["root"].children, (ent) => nodeDict[ent])
      .concat(nodeDict["root"])
      .map((ent) => {
        return DNodeUtilsV2.enhancePropForQuickInput(ent, engine.schemas);
      });
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
