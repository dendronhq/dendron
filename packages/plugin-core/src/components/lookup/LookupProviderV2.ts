import {
  DendronError,
  DEngineClient,
  DNodeProps,
  DNodePropsDict,
  DNodePropsQuickInputV2,
  DNodeUtils,
  DVault,
  getStage,
  NoteProps,
  NoteUtils,
  SchemaModuleProps,
  SchemaUtils,
  VaultUtils,
  VSCodeEvents,
} from "@dendronhq/common-all";
import { getDurationMilliseconds, vault2Path } from "@dendronhq/common-server";
import _, { DebouncedFunc } from "lodash";
import { CancellationToken, Uri, window } from "vscode";
import { LookupNoteTypeEnum } from "../../commands/LookupCommand";
import { Logger } from "../../logger";
import { EngineFlavor, EngineOpts } from "../../types";
import { AnalyticsUtils } from "../../utils/analytics";
import { DendronWorkspace, getEngine, getWS } from "../../workspace";
import { MORE_RESULTS_LABEL } from "./constants";
import { LookupControllerV2 } from "./LookupControllerV2";
import { DendronQuickPickerV2 } from "./types";
import {
  node2Uri,
  NotePickerUtils,
  PickerUtilsV2,
  showDocAndHidePicker,
} from "./utils";

const PAGINATE_LIMIT = 50;
type OnDidAcceptReturn = Promise<
  | {
      uris: Uri[];
      node: NoteProps | SchemaModuleProps | undefined;
      resp?: any;
    }
  | undefined
>;
type OnDidAcceptNewNodeReturn = Promise<
  | {
      uri: Uri;
      node: NoteProps | SchemaModuleProps;
      resp?: any | undefined;
    }
  | undefined
>;

// utils

type NoteOverride = {
  title?: string;
};
function checkAndCreateNoteOverrides(opts: {
  lc: LookupControllerV2;
  pickerValue: string;
}): NoteOverride {
  const { lc, pickerValue } = opts;
  const titleOverride = _.filter(lc.state.buttons, (ent) =>
    _.includes(Object.values(LookupNoteTypeEnum), ent.type as any)
  );
  if (!_.isEmpty(titleOverride)) {
    const button = titleOverride[0];
    // journal or scratch
    if (button.type === LookupNoteTypeEnum.journal) {
      const journalName = getWS().config.journal.name;
      const journalIndex = pickerValue.indexOf(journalName);
      if (journalIndex < 0) {
        return {};
      }
      const maybeDatePortion = pickerValue.slice(
        journalIndex + journalName.length + 1
      );
      if (maybeDatePortion.match(/\d\d\d\d\.\d\d\.\d\d$/)) {
        return {
          title: maybeDatePortion.replace(/\./g, "-"),
        };
      }
      return {};
    }
  }
  return {};
}

export class LookupProviderV2 {
  public opts: EngineOpts;
  protected onDidChangeValueDebounced?: DebouncedFunc<
    InstanceType<typeof LookupProviderV2>["onUpdatePickerItem"]
  >;

  constructor(opts: EngineOpts) {
    this.opts = opts;
  }

  createDefaultItems = ({ picker }: { picker: DendronQuickPickerV2 }) => {
    const out = [];
    if (_.find(picker.buttons, { type: "multiSelect" })?.pressed) {
      return [];
    } else {
      out.push(
        NotePickerUtils.createNoActiveItem(
          PickerUtilsV2.getVaultForOpenEditor()
        )
      );
    }
    // if (picker.moreResults) {
    //   out.push(createMoreResults());
    // }
    return out;
  };

  async _onAcceptNewNote({
    picker,
    selectedItem,
    overrides,
  }: {
    picker: DendronQuickPickerV2;
    selectedItem: DNodePropsQuickInputV2;
    overrides?: NoteOverride;
  }): OnDidAcceptNewNodeReturn {
    const ctx = "onAcceptNewNode";
    const fname = PickerUtilsV2.getValue(picker);
    Logger.info({ ctx, msg: "createNewPick", value: fname });
    let nodeNew: DNodeProps;
    let foundStub = false;
    const ws = DendronWorkspace.instance();
    const engine = ws.getEngine();
    if (selectedItem?.stub) {
      Logger.info({ ctx, msg: "create stub" });
      nodeNew = engine.notes[selectedItem.id];
      nodeNew.stub = false;
      foundStub = true;
    } else if (selectedItem?.schemaStub) {
      Logger.info({ ctx, msg: "create schema stub" });
      selectedItem.schemaStub = false;
      nodeNew = selectedItem;
    } else {
      const vault = PickerUtilsV2.getOrPromptVaultForOpenEditor();
      Logger.info({ ctx, msg: "create normal node" });
      nodeNew = NoteUtils.create({ fname, vault });
      const result = SchemaUtils.matchPath({
        notePath: fname,
        schemaModDict: engine.schemas,
      });
      if (result) {
        NoteUtils.addSchema({
          note: nodeNew,
          schemaModule: result.schemaModule,
          schema: result.schema,
        });
      }
      Logger.info({ ctx, msg: "post:maybeAddSchema", schema: result });
    }
    const maybeSchema = SchemaUtils.getSchemaFromNote({
      note: nodeNew,
      engine,
    });
    const maybeTemplate =
      maybeSchema?.schemas[nodeNew.schema?.schemaId as string].data.template;
    if (maybeSchema && maybeTemplate) {
      SchemaUtils.applyTemplate({
        template: maybeTemplate,
        note: nodeNew,
        engine,
      });
    }
    // modify note title if necessary

    if (overrides && overrides.title) {
      nodeNew.title = overrides.title;
    }
    Logger.info({ ctx, msg: "pre:checkNoteExist" });
    // TODO: check for overwriting schema
    const vault = PickerUtilsV2.getOrPromptVaultForOpenEditor();
    const noteExists = NoteUtils.getNoteByFnameV5({
      fname: nodeNew.fname,
      vault,
      notes: engine.notes,
      wsRoot: DendronWorkspace.wsRoot(),
    }) as NoteProps;
    if (
      noteExists &&
      !foundStub &&
      !selectedItem?.schemaStub &&
      VaultUtils.isEqual(
        nodeNew.vault,
        noteExists.vault,
        DendronWorkspace.wsRoot()
      )
    ) {
      Logger.error({ ctx, msg: "action will overwrite existing note" });
      throw Error("action will overwrite existing note");
    }
    if (picker.onCreate) {
      Logger.info({ ctx, msg: "pre:pickerOnCreate" });
      const out = await picker.onCreate(nodeNew);
      if (_.isUndefined(out)) {
        return;
      }
    }
    // NOTE: this needs to be after picker.onCreate since uri can still be modified at that point
    let uri = NoteUtils.getURI({
      note: nodeNew,
      wsRoot: DendronWorkspace.wsRoot(),
    });
    // vscode won't open a URI...
    uri = Uri.file(uri.fsPath);
    Logger.info({ ctx, msg: "pre:engine.write", uri });
    const resp = await engine.writeNote(nodeNew, {
      newNode: true,
    });
    if (resp.error) {
      Logger.error({ error: resp.error });
      throw Error();
    }
    return { uri, node: nodeNew, resp };
  }

  async _onAcceptNewSchema({
    picker,
    vault,
  }: {
    picker: DendronQuickPickerV2;
    vault: DVault;
  }): OnDidAcceptNewNodeReturn {
    const ctx = "onAcceptNewSchema";
    const fname = PickerUtilsV2.getValue(picker);
    Logger.info({ ctx, msg: "createNewPick", value: fname });
    const ws = DendronWorkspace.instance();
    const engine = ws.getEngine();
    Logger.info({ ctx, msg: "create normal node" });
    const smodNew: SchemaModuleProps = SchemaUtils.createModuleProps({
      fname,
      vault,
    });
    const vpath = vault2Path({ vault, wsRoot: DendronWorkspace.wsRoot() });
    const uri = Uri.file(SchemaUtils.getPath({ root: vpath, fname }));
    const resp = await engine.writeSchema(smodNew);
    return { uri, node: smodNew, resp };
  }

  async onAcceptNewNode({
    picker,
    opts,
    selectedItem,
  }: {
    picker: DendronQuickPickerV2;
    opts: EngineOpts & { overrides?: NoteOverride };
    selectedItem: DNodePropsQuickInputV2;
  }): OnDidAcceptNewNodeReturn {
    const ctx = "onAcceptNewNode";
    Logger.info({ ctx });
    const vault: DVault = PickerUtilsV2.getVaultForOpenEditor();

    if (opts.flavor === "schema") {
      return this._onAcceptNewSchema({ picker, vault });
    } else {
      return this._onAcceptNewNote({
        picker,
        selectedItem,
        overrides: opts.overrides,
      });
    }
  }

  onDidAccept({
    picker,
    opts,
    lc,
  }: {
    picker: DendronQuickPickerV2;
    opts: EngineOpts;
    lc: LookupControllerV2;
  }) {
    if (this.onDidChangeValueDebounced?.cancel) {
      this.onDidChangeValueDebounced.cancel();
    }
    lc.cancelToken.cancel();
    if (picker.canSelectMany) {
      return this.onDidAcceptForMulti(picker, opts);
    } else {
      return this.onDidAcceptForSingle(picker, opts, lc);
    }
  }

  async onDidAcceptForSingle(
    picker: DendronQuickPickerV2,
    opts: EngineOpts,
    lc: LookupControllerV2
  ): OnDidAcceptReturn {
    const ctx = "onDidAcceptSingle";
    const start = process.hrtime();
    let createNewNote = false;
    let error = false;
    try {
      const value = PickerUtilsV2.getValue(picker);
      const selectedItems = PickerUtilsV2.getSelection(picker);
      const selectedItem = selectedItems[0];

      const noteOverrides = checkAndCreateNoteOverrides({
        lc,
        pickerValue: value,
      });

      Logger.info({
        ctx,
        msg: "enter",
        value,
        opts,
        noteOverrides,
        selectedItems: selectedItems.map((ent) => NoteUtils.toLogObj(ent)),
        activeItems: picker.activeItems.map((ent) => NoteUtils.toLogObj(ent)),
      });
      const resp = this.validate(picker.value, opts.flavor);
      let uri: Uri;
      let newNode: NoteProps | SchemaModuleProps | undefined;
      if (resp) {
        window.showErrorMessage(resp);
        return;
      }
      if (selectedItem) {
        if (PickerUtilsV2.isCreateNewNotePickForSingle(selectedItem)) {
          createNewNote = true;
          const acceptResp = await this.onAcceptNewNode({
            picker,
            opts: { flavor: opts.flavor, overrides: noteOverrides },
            selectedItem,
          });
          if (_.isUndefined(acceptResp)) {
            return;
          }
          ({ uri, node: newNode } = acceptResp);
          // TODO: not used
        } else if (selectedItem.label === MORE_RESULTS_LABEL) {
          await this.paginatePickerItems({ picker });
          return;
        } else {
          uri = node2Uri(selectedItem);
          const vpath = vault2Path({
            vault: selectedItem.vault,
            wsRoot: DendronWorkspace.wsRoot(),
          });
          if (opts.flavor === "schema") {
            const smod =
              DendronWorkspace.instance().getEngine().schemas[selectedItem.id];
            uri = Uri.file(
              SchemaUtils.getPath({
                root: vpath,
                fname: smod.fname,
              })
            );
          }
        }
        await showDocAndHidePicker([uri], picker);
        return { uris: [uri], node: newNode };
      } else {
        // item from pressing enter
        if (opts.flavor === "note") {
          const vault = PickerUtilsV2.getOrPromptVaultForOpenEditor();
          const maybeNote = NoteUtils.getNoteByFnameV5({
            fname: value,
            vault,
            notes: getEngine().notes,
            wsRoot: DendronWorkspace.wsRoot(),
          });
          if (maybeNote) {
            uri = node2Uri(maybeNote);
            await showDocAndHidePicker([uri], picker);
            return { uris: [uri], node: maybeNote };
          } else {
            error = true;
            throw new DendronError({ message: `note ${value} not found` });
          }
        }
        return;
      }
    } catch (err) {
      error = true;
      Logger.error({ ctx, error: err });
      throw err;
    } finally {
      const profile = getDurationMilliseconds(start);
      AnalyticsUtils.track(VSCodeEvents.Lookup_Accept, {
        duration: profile,
        flavor: opts.flavor,
        createNewNote,
        error,
      });
    }
  }

  async onDidAcceptForMulti(
    picker: DendronQuickPickerV2,
    opts: EngineOpts
  ): OnDidAcceptReturn {
    const ctx = "onDidAccept";
    const value = PickerUtilsV2.getValue(picker);
    Logger.info({ ctx, msg: "enter", value, opts });
    let selectedItems = PickerUtilsV2.getSelection(picker);
    const resp = this.validate(picker.value, opts.flavor);
    let uris: Uri[];
    if (resp) {
      window.showErrorMessage(resp);
      return;
    }

    // check if we get note by quickpick value instead of selection
    const activeItem = picker.activeItems[0];
    const maybeNoteFname = activeItem ? activeItem.fname : value;
    const vault = PickerUtilsV2.getOrPromptVaultForOpenEditor();
    const maybeNote = NoteUtils.getNoteByFnameV5({
      fname: maybeNoteFname,
      vault,
      notes: getEngine().notes,
      wsRoot: DendronWorkspace.wsRoot(),
    }) as NoteProps;
    if (_.isEmpty(selectedItems) && opts.flavor === "note") {
      if (maybeNote) {
        if (maybeNote.stub) {
          selectedItems = [...picker.activeItems];
        } else {
          uris = [node2Uri(maybeNote)];
          await showDocAndHidePicker(uris, picker);
          return;
        }
      } else {
        selectedItems = [];
      }
    }

    // get note by selection
    const isCreateNew =
      _.some(selectedItems.map(PickerUtilsV2.isCreateNewNotePick)) ||
      _.isEmpty(selectedItems);
    if (isCreateNew && selectedItems.length > 1) {
      window.showErrorMessage(`cannot create new note when multi-select is on`);
      return;
    }
    if (isCreateNew) {
      const newNode = await this.onAcceptNewNode({
        picker,
        opts,
        selectedItem: selectedItems[0],
      });
      if (!newNode) {
        return;
      }
      uris = [newNode.uri];
    } else if (opts.flavor === "schema") {
      const smods = selectedItems.map(
        (item) => DendronWorkspace.instance().getEngine().schemas[item.id]
      );
      uris = smods.map((smod) =>
        Uri.file(
          SchemaUtils.getPath({
            root: vault2Path({
              vault: smod.vault,
              wsRoot: DendronWorkspace.wsRoot(),
            }),
            fname: smod.fname,
          })
        )
      );
    } else {
      uris = selectedItems.map((item) => node2Uri(item));
    }
    await showDocAndHidePicker(uris, picker);
    return;
  }

  paginatePickerItems = async (opts: { picker: DendronQuickPickerV2 }) => {
    const { picker } = opts;
    const allResults = opts.picker.allResults;
    const { offset } = picker as { offset: number };
    const engine = getWS().getEngine();
    const newItems = allResults!
      .slice(offset, offset + PAGINATE_LIMIT)
      .map((ent) =>
        DNodeUtils.enhancePropForQuickInput({
          wsRoot: DendronWorkspace.wsRoot(),
          props: ent,
          schemas: engine.schemas,
          vaults: DendronWorkspace.instance().vaultsv4,
        })
      );
    let oldItems = [...picker.items];
    // update state
    picker.offset = picker.offset! + PAGINATE_LIMIT;
    // no more results
    if (newItems.length <= picker.offset) {
      oldItems = _.reject(oldItems, (ent) => ent.label === MORE_RESULTS_LABEL);
      picker.moreResults = false;
    }
    picker.items = oldItems.concat(newItems);
    picker.activeItems = picker.items;
  };

  async createPickerItemsFromEngine(opts: {
    flavor: EngineFlavor;
    picker: DendronQuickPickerV2;
    qs: string;
  }) {
    const ctx = "createPickerItemsFromEngine";
    const start = process.hrtime();
    const { picker, qs } = opts;
    const engine = getWS().getEngine();
    Logger.info({ ctx, msg: "first query" });
    let nodes: DNodeProps[];
    if (opts.flavor === "note") {
      // if we are doing a query, reset pagination options
      PickerUtilsV2.resetPaginationOpts(picker);
      try {
        const resp = await engine.queryNotes({ qs });
        nodes = resp.data;
        Logger.info({ ctx, msg: "post:queryNotes" });
      } catch (err) {
        throw err;
      }
    } else {
      const resp = await engine.querySchema(qs);
      nodes = resp.data.map((ent) => SchemaUtils.getModuleRoot(ent));
    }
    if (nodes.length > PAGINATE_LIMIT) {
      picker.allResults = nodes;
      picker.offset = PAGINATE_LIMIT;
      picker.moreResults = true;
      nodes = nodes.slice(0, PAGINATE_LIMIT);
    } else {
      PickerUtilsV2.resetPaginationOpts(picker);
    }
    const updatedItems = this.createDefaultItems({ picker }).concat(
      await Promise.all(
        nodes.map(async (ent) =>
          DNodeUtils.enhancePropForQuickInput({
            wsRoot: DendronWorkspace.wsRoot(),
            props: ent,
            schemas: engine.schemas,
            vaults: DendronWorkspace.instance().vaultsv4,
          })
        )
      )
    );
    const profile = getDurationMilliseconds(start);
    Logger.info({ ctx, msg: "engine.query", profile });
    return updatedItems;
  }

  onUpdatePickerItem = async (
    picker: DendronQuickPickerV2,
    opts: EngineOpts & { force?: boolean },
    source: string,
    token: CancellationToken
    // | "updatePickerBehavior:journal"
    // | "updatePickerBehavior:scratch"
    // | "updatePickerBehavior:normal"
    // | "onValueChange"
    // | "manual"
  ) => {
    // ~~~ setup variables
    const start = process.hrtime();
    const ctx = "updatePickerItems";
    picker.busy = true;
    let pickerValue = picker.value;
    // if we just started, show all results of current parent
    if (picker._justActivated && !picker.nonInteractive) {
      // no hiearchy, query everything
      const lastDotIndex = pickerValue.lastIndexOf(".");
      if (lastDotIndex < 0) {
        pickerValue = "";
      } else {
        // assume query from last dot
        pickerValue = pickerValue.slice(0, lastDotIndex + 1);
      }
    }
    const querystring = PickerUtilsV2.slashToDot(pickerValue);
    const queryOrig = PickerUtilsV2.slashToDot(picker.value);
    const depth = queryOrig.split(".").length;
    const ws = DendronWorkspace.instance();
    let profile: number;
    const queryEndsWithDot = queryOrig.endsWith(".");
    const queryUpToLastDot =
      queryOrig.lastIndexOf(".") >= 0
        ? queryOrig.slice(0, queryOrig.lastIndexOf("."))
        : undefined;

    const engine = ws.getEngine();
    Logger.info({ ctx, msg: "enter", queryOrig, source });

    // ~~~ update results
    try {
      if (querystring === "") {
        Logger.debug({ ctx, msg: "empty qs" });
        picker.items = this.showRootResults(opts.flavor, engine);
        return;
      }

      // current items without default items present
      const items: DNodePropsQuickInputV2[] = [...picker.items];
      let updatedItems = PickerUtilsV2.filterDefaultItems(items);

      Logger.debug({
        ctx,
        pickerValue,
        msg: "qs",
      });
      // check if need to cancel
      if (token.isCancellationRequested) {
        return;
      }

      // first query, show all results
      // subsequent query, only show next level children
      if (
        true
        // queryEndsWithDot ||
        // queryOrig.split(".").length < 2 ||
        // picker.justActivated ||
        // opts?.force
      ) {
        updatedItems = await this.createPickerItemsFromEngine({
          picker,
          flavor: opts.flavor,
          qs: querystring,
        });
      } else {
        // add create new
        updatedItems = this.createDefaultItems({ picker }).concat(updatedItems);
      }

      if (token.isCancellationRequested) {
        return;
      }
      // check if single item query, vscode doesn't surface single letter queries
      if (picker.activeItems.length === 0 && querystring.length === 1) {
        picker.items = updatedItems;
        picker.activeItems = picker.items;
        return;
      }

      // don't use query string since this can change
      const perfectMatch =
        opts.flavor === "note"
          ? _.find(updatedItems, { fname: queryOrig })
          : _.find(updatedItems, { id: queryOrig });
      // NOTE: we modify this later so need to track this here
      const noUpdatedItems = updatedItems.length === 0;

      // add schema suggestions
      if (opts.flavor === "note" && !_.isUndefined(queryUpToLastDot)) {
        const results = SchemaUtils.matchPath({
          notePath: queryUpToLastDot,
          schemaModDict: engine.schemas,
        });
        // since namespace matches everything, we don't do queries on that
        if (results && !results.namespace) {
          const { schema, schemaModule } = results;
          const dirName = queryUpToLastDot;
          const candidates = schema.children
            .map((ent) => {
              const mschema = schemaModule.schemas[ent];
              if (
                SchemaUtils.hasSimplePattern(mschema, {
                  isNotNamespace: true,
                })
              ) {
                const pattern = SchemaUtils.getPattern(mschema, {
                  isNotNamespace: true,
                });
                const fname = [dirName, pattern].join(".");
                return NoteUtils.fromSchema({
                  schemaModule,
                  schemaId: ent,
                  fname,
                  vault: PickerUtilsV2.getVaultForOpenEditor(),
                });
              }
              return;
            })
            .filter(Boolean) as NoteProps[];
          const candidatesToAdd = _.differenceBy(
            candidates,
            updatedItems,
            (ent) => ent.fname
          );
          updatedItems = updatedItems.concat(
            candidatesToAdd.map((ent) => {
              return DNodeUtils.enhancePropForQuickInput({
                wsRoot: DendronWorkspace.wsRoot(),
                props: ent,
                schemas: engine.schemas,
                vaults: DendronWorkspace.instance().vaultsv4,
              });
            })
          );
        }
      }
      if (token.isCancellationRequested) {
        return;
      }
      // check if new item, return if that's the case
      if (
        noUpdatedItems ||
        (picker.activeItems.length === 0 && !perfectMatch && !queryEndsWithDot)
      ) {
        Logger.debug({ ctx, msg: "no matches" });
        picker.items = updatedItems;
        return;
      }
      if (picker.showDirectChildrenOnly) {
        updatedItems = PickerUtilsV2.filterByDepth(updatedItems, depth);
      }

      if (perfectMatch) {
        Logger.debug({ ctx, msg: "active = qs" });
        picker.activeItems = [perfectMatch];
        picker.items = updatedItems;
        // TODO: this defaults to current vault if no note is open
        const openedVault = PickerUtilsV2.getVaultForOpenEditor();

        if (
          VaultUtils.isEqual(
            openedVault,
            perfectMatch.vault,
            DendronWorkspace.wsRoot()
          )
        ) {
          picker.items = PickerUtilsV2.filterCreateNewItem(updatedItems);
        }
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
      window.showErrorMessage(err);
      throw Error(err);
    } finally {
      profile = getDurationMilliseconds(start);
      picker.busy = false;
      picker._justActivated = false;
      Logger.info({
        ctx,
        msg: "exit",
        queryOrig,
        source,
        profile,
        cancelled: token.isCancellationRequested,
      });
      AnalyticsUtils.track(VSCodeEvents.Lookup_Update, {
        duration: profile,
        source,
        flavor: opts.flavor,
      });
      return picker;
    }
  };

  provide({
    picker,
    lc,
  }: {
    picker: DendronQuickPickerV2;
    lc: LookupControllerV2;
  }) {
    const { opts } = this;
    const _this = this;
    picker.onDidAccept(() => {
      const ctx = "LookupProvider:onAccept";
      // NOTE: unfortunate hack to not get prompted for testing
      if (getStage() === "test") {
        return;
      }
      this.onDidAccept({ picker, opts, lc }).catch((err) => {
        Logger.error({
          ctx,
          error: new DendronError({
            message:
              "something went wrong. please submit a bug report to https://github.com/dendronhq/dendron/issues/new?assignees=&labels=&template=bug_report.md&title= with the output of `Dendron: Open Log`",
            payload: err,
          }),
        });
      });
    });

    // create debounced update method
    this.onDidChangeValueDebounced = _.debounce(
      _.bind(this.onUpdatePickerItem, _this),
      60,
      { leading: true, maxWait: 120 }
    ) as DebouncedFunc<typeof _this.onUpdatePickerItem>;

    // picker.onDidChangeSelection(() => {
    //   Logger.info({ctx: "onDidChangeSelection", picker: PickerUtilsV2.dumpPicker(picker)})
    // });
    // picker.onDidChangeActive(()=> {
    //   Logger.info({ctx: "onDidChangeActive", picker: PickerUtilsV2.dumpPicker(picker)})
    // })

    picker.onDidChangeValue(() => {
      if (_.isUndefined(this.onDidChangeValueDebounced)) {
        throw new DendronError({ message: "onAccept already called" });
      }

      this.onDidChangeValueDebounced(
        picker,
        opts,
        "onValueChange",
        lc.createCancelSource().token
      );
    });
  }

  showRootResults(
    flavor: EngineFlavor,
    engine: DEngineClient
  ): DNodePropsQuickInputV2[] {
    let nodeDict: DNodePropsDict;
    let nodes: DNodeProps[];
    if (flavor === "note") {
      nodeDict = engine.notes;
      const roots = NoteUtils.getRoots(nodeDict);
      const childrenOfRoot = roots.flatMap((ent) => ent.children);
      nodes = _.map(childrenOfRoot, (ent) => nodeDict[ent]).concat(roots);
    } else {
      nodeDict = _.mapValues(engine.schemas, (ent) => ent.root);
      nodes = _.map(_.values(engine.schemas), (ent: SchemaModuleProps) => {
        return SchemaUtils.getModuleRoot(ent);
      });
    }
    return nodes.map((ent) => {
      return DNodeUtils.enhancePropForQuickInput({
        wsRoot: DendronWorkspace.wsRoot(),
        props: ent,
        schemas: engine.schemas,
        vaults: DendronWorkspace.instance().vaultsv4,
      });
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
