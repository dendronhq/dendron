import clipboardy from "@dendronhq/clipboardy";
import {
  DEngineClientV2,
  DNodePropsQuickInputV2,
  DNodeUtilsV2,
  DVault,
  SchemaModulePropsV2,
  SchemaUtilsV2,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import {
  DirResult,
  file2Note,
  tmpDir,
  vault2Path,
} from "@dendronhq/common-server";
import {
  ENGINE_HOOKS,
  ENGINE_QUERY_PRESETS,
  ENGINE_WRITE_PRESETS,
  NotePresetsUtils,
  NoteTestUtilsV4,
  NOTE_PRESETS_V4,
  PLUGIN_CORE,
  runJestHarnessV2,
  TestPresetEntryV4,
} from "@dendronhq/common-test-utils";
import { DendronEngineV2, loc2Path } from "@dendronhq/engine-server";
import assert from "assert";
import _ from "lodash";
import { afterEach, beforeEach, describe } from "mocha";
import path from "path";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { CancellationTokenSource } from "vscode-languageclient";
import { LookupCommand, LookupCommandOpts } from "../../commands/LookupCommand";
import {
  CopyNoteLinkButton,
  MultiSelectBtn,
} from "../../components/lookup/buttons";
import { LookupControllerV2 } from "../../components/lookup/LookupControllerV2";
import { LookupProviderV2 } from "../../components/lookup/LookupProviderV2";
import { DendronQuickPickerV2 } from "../../components/lookup/types";
import { createNoActiveItem } from "../../components/lookup/utils";
import { CONFIG, ConfigKey } from "../../constants";
import { HistoryService } from "../../services/HistoryService";
import { EngineFlavor, EngineOpts } from "../../types";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace, getWS } from "../../workspace";
import { _activate } from "../../_extension";
import {
  createMockQuickPick,
  getActiveEditorBasename,
  onWSInit,
  setupDendronWorkspace,
  TIMEOUT,
} from "../testUtils";
import {
  expect,
  getNoteFromTextEditor,
  setupCodeWorkspaceV2,
} from "../testUtilsv2";
import {
  createEngineFactory,
  runLegacyMultiWorkspaceTest,
  runLegacySingleWorkspaceTest,
} from "../testUtilsV3";
import fs from "fs-extra";
import { lookup } from "dns";

const { LOOKUP_SINGLE_TEST_PRESET } = PLUGIN_CORE;

const createEngineForSchemaUpdateItems = createEngineFactory({
  querySchema: (_opts: WorkspaceOpts) => {
    const querySchema: DendronEngineV2["querySchema"] = async (qs) => {
      const engOpts: EngineOpts = { flavor: "schema" };
      const ws = DendronWorkspace.instance();
      const client = ws.getEngine();
      const lc = new LookupControllerV2(engOpts);
      const lp = new LookupProviderV2(engOpts);
      const quickpick = await lc.show();
      quickpick.value = qs;
      await lp.onUpdatePickerItem(
        quickpick,
        engOpts,
        "manual",
        lc.cancelToken.token
      );
      const schemaModules = _.map(
        lc.quickPick?.items,
        (ent) => client.schemas[ent.id]
      ).filter((ent) => !_.isUndefined(ent));
      return {
        data: schemaModules,
        error: null,
      };
    };
    return querySchema;
  },
});

const createEngineForNoteUpdateItems = createEngineFactory({
  queryNotes: (_opts: WorkspaceOpts) => {
    const queryNotes: DendronEngineV2["queryNotes"] = async (opts) => {
      return new Promise(async (resolve) => {
        const engOpts: EngineOpts = { flavor: "note" };
        const ws = DendronWorkspace.instance();
        const client = ws.getEngine();
        const lc = new LookupControllerV2(engOpts);
        const lp = new LookupProviderV2(engOpts);
        const quickpick = await lc.show();
        quickpick.value = opts.qs;
        const newPicker = await lp.onUpdatePickerItem(
          quickpick,
          { ...engOpts, force: true },
          "manual",
          lc.cancelToken.token
        );
        let data = _.map(
          newPicker?.items,
          (ent) => client.notes[ent.id]
        ).filter((ent) => !_.isUndefined(ent));
        if (opts.vault) {
          // NOTE: this is a hack
          data = data.filter(
            (ent) =>
              path.basename(ent.vault.fsPath) ===
              path.basename(opts.vault?.fsPath as string)
          );
        }
        resolve({ data, error: null });

        // return {
        //   data,
        //   error: null,
        // };
      });
    };
    return queryNotes;
  },
});

const lookupHelper = async (flavor: EngineFlavor) => {
  const engOpts: EngineOpts = { flavor };
  const lc = new LookupControllerV2(engOpts);
  const lp = new LookupProviderV2(engOpts);
  const picker = await lc.show();
  return { lc, lp, picker };
};

const schemaAcceptHelper = async (qs: string) => {
  const engOpts: EngineOpts = { flavor: "schema" };
  const ws = DendronWorkspace.instance();
  const client = ws.getEngine();
  let schemaModule = client.schemas[qs];
  const schemaInput = SchemaUtilsV2.enhanceForQuickInput({
    props: schemaModule,
    vaults: DendronWorkspace.instance().config.vaults,
  });
  const quickpick = createMockQuickPick({
    value: qs,
    selectedItems: [schemaInput],
  });
  const lc = new LookupControllerV2(engOpts);
  const lp = new LookupProviderV2(engOpts);
  const resp = await lp.onDidAccept({
    picker: quickpick,
    opts: engOpts,
    lc,
  });
  return resp?.uris;
};

const createEngineForSchemaAcceptQuery = createEngineFactory({
  writeSchema: (_opts: WorkspaceOpts) => {
    const func: DendronEngineV2["writeSchema"] = async (schema) => {
      const engOpts: EngineOpts = { flavor: "schema" };
      const quickpick = createMockQuickPick({
        value: schema.fname,
        selectedItems: [createNoActiveItem(schema.vault)],
      });
      const lc = new LookupControllerV2(engOpts);
      const lp = new LookupProviderV2(engOpts);
      await lp.onDidAccept({
        picker: quickpick,
        opts: engOpts,
        lc,
      });
      await quickpick.hide();
    };
    return func;
  },
  querySchema: (_opts: WorkspaceOpts) => {
    const querySchema: DendronEngineV2["querySchema"] = async (qs) => {
      const uris = await schemaAcceptHelper(qs);
      const schemas = uris?.map((ent) => {
        return SchemaUtilsV2.getSchemaModuleByFnameV4({
          fname: path.basename(ent.fsPath, ".schema.yml"),
          schemas: getWS().getEngine().schemas,
          vault: { fsPath: path.dirname(ent.fsPath) },
        });
      }) as SchemaModulePropsV2[];
      return {
        error: null,
        data: schemas,
      };
    };
    return querySchema;
  },
});

const createEngineForNoteAccept = createEngineFactory({
  writeNote: (_opts: WorkspaceOpts) => {
    const func: DendronEngineV2["writeNote"] = async (note) => {
      const engOpts: EngineOpts = { flavor: "note" };
      const quickpick = createMockQuickPick({
        value: note.fname,
        selectedItems: [createNoActiveItem(note.vault)],
      });
      const lc = new LookupControllerV2(engOpts);
      const lp = new LookupProviderV2(engOpts);
      const resp = await lp.onDidAccept({
        picker: quickpick,
        opts: engOpts,
        lc,
      });
      if (_.isUndefined(resp)) {
        throw Error("undefined");
      }
      return resp.resp;
    };
    return func;
  },
  queryNotes: (_opts: WorkspaceOpts) => {
    const queryNotes: DendronEngineV2["queryNotes"] = async (opts) => {
      return getWS().getEngine().queryNotes(opts);
    };
    return queryNotes;
  },
});

suite("schemas", function () {
  let ctx: vscode.ExtensionContext;
  this.timeout(TIMEOUT);

  beforeEach(function () {
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
  });

  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
  });

  describe("updateItems", function () {
    _.map(
      ENGINE_QUERY_PRESETS["SCHEMAS"],
      (TestCase: TestPresetEntryV4, name) => {
        test(name, (done) => {
          const { testFunc, preSetupHook } = TestCase;
          runLegacyMultiWorkspaceTest({
            ctx,
            postSetupHook: async ({ wsRoot, vaults }) => {
              await preSetupHook({
                wsRoot,
                vaults,
              });
            },
            onInit: async ({ vaults, wsRoot }) => {
              const engineMock = createEngineForSchemaUpdateItems({
                wsRoot,
                vaults,
              });
              const results = await testFunc({
                engine: engineMock,
                vaults,
                wsRoot,
                initResp: {} as any,
              });
              await runJestHarnessV2(results, expect);
              done();
            },
          });
        });
      }
    );
  });

  describe.skip("onAccept", function () {
    _.map(
      _.pick(ENGINE_QUERY_PRESETS["SCHEMAS"], "SIMPLE"),
      (TestCase: TestPresetEntryV4, name) => {
        test(name, (done) => {
          const { testFunc, preSetupHook } = TestCase;
          runLegacyMultiWorkspaceTest({
            ctx,
            postSetupHook: async ({ wsRoot, vaults }) => {
              await preSetupHook({
                wsRoot,
                vaults,
              });
            },
            onInit: async ({ vaults, wsRoot }) => {
              const engineMock = createEngineForSchemaAcceptQuery({
                wsRoot,
                vaults,
              });
              const results = await testFunc({
                engine: engineMock,
                vaults,
                wsRoot,
                initResp: {} as any,
              });
              await runJestHarnessV2(results, expect);
              done();
            },
          });
        });
      }
    );

    _.map(
      _.pick(ENGINE_WRITE_PRESETS.SCHEMAS, "ADD_NEW_MODULE_NO_CHILD"),
      (TestCase: TestPresetEntryV4, name) => {
        test(name, (done) => {
          const { testFunc, preSetupHook } = TestCase;
          runLegacyMultiWorkspaceTest({
            ctx,
            postSetupHook: async ({ wsRoot, vaults }) => {
              await preSetupHook({
                wsRoot,
                vaults,
              });
            },
            onInit: async ({ vaults, wsRoot }) => {
              const engineMock = createEngineForSchemaAcceptQuery({
                wsRoot,
                vaults,
              });
              const results = await testFunc({
                engine: engineMock,
                vaults,
                wsRoot,
                initResp: {} as any,
              });
              await runJestHarnessV2(results, expect);
              done();
            },
          });
        });
      }
    );
  });
});

suite("notesv2", function () {
  let ctx: vscode.ExtensionContext;
  this.timeout(TIMEOUT);
  beforeEach(function () {
    HistoryService.instance().clearSubscriptions();
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
  });

  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
  });

  describe("updateItems", function () {
    _.forEach(
      ENGINE_QUERY_PRESETS["NOTES"],
      (TestCase: TestPresetEntryV4, name) => {
        test(name, (done) => {
          const { testFunc, preSetupHook } = TestCase;
          runLegacyMultiWorkspaceTest({
            ctx,
            postSetupHook: async ({ wsRoot, vaults }) => {
              await preSetupHook({
                wsRoot,
                vaults,
              });
            },
            onInit: async ({ vaults, wsRoot }) => {
              const engineMock = createEngineForNoteUpdateItems({
                wsRoot,
                vaults,
              });
              const results = await testFunc({
                engine: engineMock,
                vaults,
                wsRoot,
                initResp: {} as any,
                extra: { vscode: true },
              });
              await runJestHarnessV2(results, expect);
              done();
            },
          });
        });
      }
    );

    test("opened note", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({}) => {
          const engOpts: EngineOpts = { flavor: "note" };
          const lc = new LookupControllerV2(engOpts);
          const lp = new LookupProviderV2(engOpts);
          const root = DendronWorkspace.wsRoot();
          await VSCodeUtils.openFileInEditor(
            vscode.Uri.file(path.join(root, "vault1", "foo.md"))
          );
          const quickpick = await lc.show();
          quickpick.onDidChangeActive(() => {
            assert.equal(lc.quickPick?.activeItems.length, 1);
            assert.equal(lc.quickPick?.activeItems[0].fname, "foo");
            done();
          });
          await lp.onUpdatePickerItem(
            quickpick,
            engOpts,
            "manual",
            lc.cancelToken.token
          );
        },
      });
    });

    test("remove stub status after creation", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await NOTE_PRESETS_V4.NOTE_SIMPLE_CHILD.create({
            vault: vaults[0],
            wsRoot,
          });
        },
        onInit: async ({}) => {
          const engOpts: EngineOpts = { flavor: "note" };
          const lc = new LookupControllerV2(engOpts);
          const lp = new LookupProviderV2(engOpts);

          let quickpick = await lc.show();
          let note = _.find(quickpick.items, {
            fname: "foo",
          }) as DNodePropsQuickInputV2;
          assert.ok(note.stub);
          quickpick.selectedItems = [note];
          await lp.onDidAccept({ picker: quickpick, opts: engOpts, lc });
          lc.onDidHide(async () => {
            assert.equal(
              path.basename(
                VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath as string
              ),
              "foo.md"
            );
            const lc2 = new LookupControllerV2(engOpts);
            const quickpick2 = await lc2.show();
            note = _.find(quickpick2.items, {
              fname: "foo",
            }) as DNodePropsQuickInputV2;
            assert.ok(!note.stub);
            done();
          });
          quickpick.hide();
        },
      });
    });

    test("schema suggestion", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        postSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
          const vpath = vault2Path({ vault: vaults[0], wsRoot });
          fs.removeSync(path.join(vpath, "foo.ch1.md"));
        },
        onInit: async ({}) => {
          const { lc, lp, picker: quickpick } = await lookupHelper("note");
          quickpick.value = "foo.";
          await lp.onUpdatePickerItem(
            quickpick,
            { flavor: "note" },
            "manual",
            lc.cancelToken.token
          );
          const schemaItem = _.pick(
            _.find(quickpick.items, { fname: "foo.ch1" }),
            ["fname", "schemaStub"]
          );
          await runJestHarnessV2(
            [
              {
                actual: schemaItem,
                expected: {
                  fname: "foo.ch1",
                  schemaStub: true,
                },
              },
            ],
            expect
          );
          done();
        },
      });
    });

    test("filter by depth", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
          await NOTE_PRESETS_V4.NOTE_SIMPLE_GRANDCHILD.create({
            wsRoot,
            vault: vaults[0],
          });
        },
        onInit: async ({}) => {
          const { picker: quickpick, lp, lc } = await lookupHelper("note");
          quickpick.value = "foo.";
          quickpick.showDirectChildrenOnly = true;
          await lp.onUpdatePickerItem(
            quickpick,
            { flavor: "note" },
            "manual",
            lc.cancelToken.token
          );
          assert.deepStrictEqual(quickpick.items.length, 4);
          assert.deepStrictEqual(
            _.find(quickpick.items, { fname: "foo.ch1.gch1" }),
            undefined
          );
          done();
        },
      });
    });
  });

  describe.only("onAccept", function () {
    _.map(
      _.pick(ENGINE_WRITE_PRESETS["NOTES"], "NEW_DOMAIN"),
      (TestCase: TestPresetEntryV4, name) => {
        test(name, (done) => {
          const { testFunc, preSetupHook } = TestCase;
          runLegacyMultiWorkspaceTest({
            ctx,
            postSetupHook: async ({ wsRoot, vaults }) => {
              await preSetupHook({
                wsRoot,
                vaults,
              });
            },
            onInit: async ({ vaults, wsRoot }) => {
              const engineMock = createEngineForNoteAccept({
                wsRoot,
                vaults,
              });
              const results = await testFunc({
                engine: engineMock,
                vaults,
                wsRoot,
                initResp: {} as any,
              });
              await runJestHarnessV2(results, expect);
              done();
            },
          });
        });
      }
    );
  });
});

suite.skip("notes", function () {
  let root: DirResult;
  let ctx: vscode.ExtensionContext;
  this.timeout(TIMEOUT);

  describe("onAccept", function () {
    const engOpts: EngineOpts = { flavor: "note" };
    let ws: DendronWorkspace;
    let client: DEngineClientV2;

    test("existing note", function (done) {
      runAcceptItemTest({
        ctx,
        onInitCb: async ({ lp, lc }) => {
          ws = DendronWorkspace.instance();
          client = ws.getEngine();
          const note = client.notes["foo"];
          const item = DNodeUtilsV2.enhancePropForQuickInput({
            props: note,
            schemas: client.schemas,
            vaults: DendronWorkspace.instance().config.vaults,
          });
          const quickpick = createMockQuickPick({
            value: "foo",
            selectedItems: [item],
          });
          await lp.onDidAccept({ picker: quickpick, opts: engOpts, lc });
          await NodeTestPresetsV2.runMochaHarness({
            opts: {
              activeFileName: DNodeUtilsV2.fname(
                VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath as string
              ),
              activeNote: getNoteFromTextEditor(),
            },
            results:
              LOOKUP_SINGLE_TEST_PRESET.ACCEPT_ITEMS.EXISTING_ITEM.results,
          });
          done();
        },
      });
    });

    test("lookup new node with schema template", function (done) {
      runAcceptItemTest({
        ctx,
        beforeActivateCb: async ({ vaults }) => {
          const vaultDir = vaults[0].fsPath;
          const vault = vaults[0];
          await NodeTestUtilsV2.createNote({
            vaultDir,
            noteProps: { body: "Template text", fname: "bar.one.temp", vault },
          });
          await NodeTestUtilsV2.createNote({
            vaultDir,
            noteProps: {
              body: "text from alpha template",
              fname: "bar.temp.alpha",
              vault,
            },
          });
          await NodeTestUtilsV2.createSchema({
            vaultDir,
            schemas: [
              SchemaUtilsV2.create({
                id: "bar",
                parent: "root",
                namespace: true,
                children: ["one", "three"],
                vault,
              }),
              SchemaUtilsV2.create({
                id: "one",
                template: { id: "bar.one.temp", type: "note" },
                children: ["alpha"],
                vault,
              }),
              SchemaUtilsV2.create({ id: "alpha", vault }),
              SchemaUtilsV2.create({
                id: "three",
                template: { id: "bar.temp.alpha", type: "note" },
                vault,
              }),
            ],
            fname: "bar",
          });
        },
        onInitCb: async ({ lp, vaults, lc }) => {
          ws = DendronWorkspace.instance();
          client = ws.getEngine();
          const picker = createMockQuickPick({
            value: "bar.ns1.three",
            selectedItems: [createNoActiveItem(vaults[0])],
          });

          await lp.onUpdatePickerItem(
            picker,
            engOpts,
            "manual",
            new CancellationTokenSource().token
          );
          await lp.onDidAccept({ picker, opts: engOpts, lc });
          const node = getNoteFromTextEditor();
          assert.strictEqual(_.trim(node.body), "text from alpha template");
          done();
        },
      });
    });

    test("lookup new node with schema template from suggestion", function (done) {
      runAcceptItemTest({
        ctx,
        beforeActivateCb: async ({ vaults }) => {
          const vault = vaults[0];
          const vaultDir = vault.fsPath;
          await NodeTestUtilsV2.createNote({
            vaultDir,
            noteProps: { body: "Template text", fname: "bar.one.temp", vault },
          });
          await NodeTestUtilsV2.createNote({
            vaultDir,
            noteProps: {
              body: "text from alpha template",
              fname: "bar.temp.alpha",
              desc: "desc from alpha",
              custom: {
                bond: 42,
              },
              vault,
            },
          });
          await NodeTestUtilsV2.createSchema({
            vaultDir,
            schemas: [
              SchemaUtilsV2.create({
                id: "bar",
                parent: "root",
                namespace: true,
                children: ["one", "three"],
                vault,
              }),
              SchemaUtilsV2.create({
                id: "one",
                template: { id: "bar.one.temp", type: "note" },
                children: ["alpha"],
                vault,
              }),
              SchemaUtilsV2.create({ id: "alpha", vault }),
              SchemaUtilsV2.create({
                id: "three",
                template: { id: "bar.temp.alpha", type: "note" },
                vault,
              }),
            ],
            fname: "bar",
          });
        },
        onInitCb: async ({ lp, vaults, lc }) => {
          ws = DendronWorkspace.instance();
          client = ws.getEngine();
          const picker = createMockQuickPick({
            value: "bar.ns1.",
            selectedItems: [createNoActiveItem(vaults[0])],
          });
          await lp.onUpdatePickerItem(
            picker,
            engOpts,
            "manual",
            new CancellationTokenSource().token
          );
          assert.deepStrictEqual(
            _.find(picker.items, { fname: "bar.ns1.three" })?.schema,
            { moduleId: "bar", schemaId: "three" }
          );
          picker.value = "bar.ns1.three";
          await lp.onDidAccept({ picker, opts: engOpts, lc });
          const node = getNoteFromTextEditor();
          assert.strictEqual(_.trim(node.body), "text from alpha template");
          assert.strictEqual(_.trim(node.desc), "desc from alpha");
          assert.deepStrictEqual(node.custom, { bond: 42 });
          done();
        },
      });
    });

    test("new node with schema template for namespace", function (done) {
      runAcceptItemTest({
        ctx,
        beforeActivateCb: async ({ vaults }) => {
          const vault = vaults[0];
          const vaultDir = vault.fsPath;
          await NodeTestUtilsV2.createNote({
            vaultDir,
            noteProps: {
              body: "Template text",
              fname: "journal.template",
              vault,
            },
          });
          await NodeTestUtilsV2.createSchema({
            vaultDir,
            schemas: [
              SchemaUtilsV2.create({
                id: "journal",
                parent: "root",
                children: ["year"],
                vault,
              }),
              SchemaUtilsV2.create({
                id: "year",
                pattern: "[0-2][0-9][0-9][0-9]",
                children: ["month"],
                vault,
              }),
              SchemaUtilsV2.create({
                id: "month",
                pattern: "[0-9][0-9]",
                children: ["day"],
                vault,
              }),
              SchemaUtilsV2.create({
                id: "day",
                pattern: "[0-9][0-9]",
                namespace: true,
                template: {
                  id: "journal.template",
                  type: "note",
                },
                vault,
              }),
            ],
            fname: "journal",
          });
        },
        onInitCb: async ({ lp, vaults, lc }) => {
          ws = DendronWorkspace.instance();
          client = ws.getEngine();
          const picker = createMockQuickPick({
            value: "journal.2020.08.10",
            selectedItems: [createNoActiveItem(vaults[0])],
          });
          await lp.onUpdatePickerItem(
            picker,
            engOpts,
            "manual",
            new CancellationTokenSource().token
          );
          await lp.onDidAccept({ picker, opts: engOpts, lc });
          const node = getNoteFromTextEditor();
          assert.strictEqual(_.trim(node.body), "Template text");
          done();
        },
      });
    });
  });

  describe("onAccept: multiple ", function () {
    const engOpts: EngineOpts = { flavor: "note" };
    let ws: DendronWorkspace;
    let client: DEngineClientV2;

    test("existing notes", function (done) {
      onWSInit(async () => {
        ws = DendronWorkspace.instance();
        client = ws.getEngine();
        const notes = ["foo", "foo.ch1"].map((fname) => client.notes[fname]);
        const items = notes.map((note) =>
          DNodeUtilsV2.enhancePropForQuickInput({
            props: note,
            schemas: client.schemas,
            vaults: DendronWorkspace.instance().config.vaults,
          })
        );
        const quickpick = createMockQuickPick({
          value: "foo",
          selectedItems: items,
        });
        quickpick.canSelectMany = true;
        const lc = new LookupControllerV2(engOpts);
        const lp = new LookupProviderV2(engOpts);
        await lp.onDidAccept({ picker: quickpick, opts: engOpts, lc });
        const openWindows = vscode.workspace.textDocuments.map((ent) =>
          path.basename(ent.uri.fsPath, ".md")
        );
        assert.ok(_.every(notes.map((n) => _.includes(openWindows, n.fname))));
        done();
      });
      setupCodeWorkspaceV2({
        ctx,
        initDirCb: createOneNoteOneSchemaPresetCallback,
        wsRoot: root.name,
      }).then(() => _activate(ctx));
    });

    test("new note, when multipe notes selected", function (done) {
      runAcceptItemTest({
        ctx,
        onInitCb: async ({ lp, vaults, lc }) => {
          await VSCodeUtils.closeAllEditors();
          ws = DendronWorkspace.instance();
          client = ws.getEngine();
          const notes = ["foo", "foo.ch1"].map((fname) => client.notes[fname]);
          const items = notes.map((note) =>
            DNodeUtilsV2.enhancePropForQuickInput({
              props: note,
              schemas: client.schemas,
              vaults: DendronWorkspace.instance().config.vaults,
            })
          );
          const quickpick = createMockQuickPick({
            value: "bond",
            selectedItems: items.concat(createNoActiveItem(vaults[0])),
          });
          quickpick.canSelectMany = true;
          await lp.onDidAccept({ picker: quickpick, opts: engOpts, lc });
          const active = VSCodeUtils.getActiveTextEditor();
          assert.ok(_.isUndefined(active));
          done();
        },
      });
    });
  });
});

// suite("Scratch Notes", function () {
//   let root: DirResult;
//   let ctx: vscode.ExtensionContext;
//   this.timeout(TIMEOUT);

//   beforeEach(function () {
//     root = tmpDir();
//     ctx = VSCodeUtils.getOrCreateMockContext();
//     DendronWorkspace.getOrCreate(ctx);
//   });

//   afterEach(function () {
//     HistoryService.instance().clearSubscriptions();
//   });

//   test("Lookup scratch note", function (done) {
//     onWSInit(async () => {
//       // const editor = VSCodeUtils.getActiveTextEditor();
//       const uri = vscode.Uri.file(path.join(root.name, "vault", "foo.md"));
//       const editor = (await VSCodeUtils.openFileInEditor(
//         uri
//       )) as vscode.TextEditor;
//       editor.selection = new vscode.Selection(9, 0, 9, 12);
//       await new LookupCommand().execute({
//         selectionType: "selection2link",
//         noteType: "journal",
//       });
//       done();
//     });

//     setupDendronWorkspace(root.name, ctx, {
//       lsp: true,
//       useCb: async () => {
//         NodeTestUtils.createNotes(path.join(root.name, "vault"), [
//           {
//             id: "id.foo",
//             fname: "foo",
//             body: "# Foo Content\nFoo line",
//           },
//         ]);
//       },
//     });
//   });

//   test("Lookup scratch note", function (done) {
//     onWSInit(async () => {
//       // const editor = VSCodeUtils.getActiveTextEditor();
//       const uri = vscode.Uri.file(path.join(root.name, "vault", "foo.md"));
//       const editor = (await VSCodeUtils.openFileInEditor(
//         uri
//       )) as vscode.TextEditor;
//       editor.selection = new vscode.Selection(9, 0, 9, 12);
//       await new LookupCommand().execute({
//         selectionType: "selection2link",
//         noteType: "scratch",
//       });
//       done();
//     });

//     setupDendronWorkspace(root.name, ctx, {
//       useCb: async () => {
//         NodeTestUtils.createNotes(path.join(root.name, "vault"), [
//           {
//             id: "id.foo",
//             fname: "foo",
//             body: "# Foo Content\nFoo line",
//           },
//         ]);
//       },
//     });
//   });

//   test("Lookup selection2link", function (done) {
//     onWSInit(async () => {
//       // const editor = VSCodeUtils.getActiveTextEditor();
//       const uri = vscode.Uri.file(path.join(root.name, "vault", "foo.md"));
//       const editor = (await VSCodeUtils.openFileInEditor(
//         uri
//       )) as vscode.TextEditor;
//       editor.selection = new vscode.Selection(9, 0, 9, 12);
//       await new LookupCommand().execute({ selectionType: "selection2link" });
//       done();
//     });

//     setupDendronWorkspace(root.name, ctx, {
//       useCb: async () => {
//         NodeTestUtils.createNotes(path.join(root.name, "vault"), [
//           {
//             id: "id.foo",
//             fname: "foo",
//             body: "# Foo Content\nFoo line",
//           },
//         ]);
//       },
//     });
//   });
// });

suite.skip("selection2Link", function () {
  let root: DirResult;
  let ctx: vscode.ExtensionContext;
  let lookupOpts: LookupCommandOpts = {
    noteType: "scratch",
    selectionType: "selection2link",
    noConfirm: true,
    flavor: "note",
  };
  let vaultDir: string;
  this.timeout(TIMEOUT);

  beforeEach(function () {
    root = tmpDir();
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
  });

  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
  });

  test("slug title", function (done) {
    onWSInit(async () => {
      const uri = vscode.Uri.file(path.join(vaultDir, "foo.md"));
      const editor = (await VSCodeUtils.openFileInEditor(
        uri
      )) as vscode.TextEditor;
      editor.selection = new vscode.Selection(7, 0, 7, 12);
      await new LookupCommand().execute(lookupOpts);
      assert.ok(getActiveEditorBasename().startsWith("scratch"));
      assert.ok(getActiveEditorBasename().endsWith("foo-body.md"));
      done();
    });
    setupDendronWorkspace(root.name, ctx, {
      useCb: (_vaultDir) => {
        vaultDir = _vaultDir;
        return NodeTestPresetsV2.createOneNoteOneSchemaPresetWithBody({
          vaultDir,
        });
      },
    });
  });

  test("no slug title", function (done) {
    onWSInit(async () => {
      const uri = vscode.Uri.file(path.join(vaultDir, "foo.md"));
      const editor = (await VSCodeUtils.openFileInEditor(
        uri
      )) as vscode.TextEditor;
      editor.selection = new vscode.Selection(7, 0, 7, 12);
      await new LookupCommand().execute(lookupOpts);
      assert.ok(getActiveEditorBasename().startsWith("scratch"));
      assert.ok(!getActiveEditorBasename().endsWith("foo-body.md"));
      done();
    });
    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      configOverride: {
        [CONFIG.LINK_SELECT_AUTO_TITLE_BEHAVIOR.key]: "none",
      },
      useCb: (_vaultDir) => {
        vaultDir = _vaultDir;
        return NodeTestPresetsV2.createOneNoteOneSchemaPresetWithBody({
          vaultDir,
        });
      },
    });
  });
});

suite.skip("scratch notes", function () {
  let root: DirResult;
  let ctx: vscode.ExtensionContext;
  let noteType = "SCRATCH";
  let lookupOpts: LookupCommandOpts = {
    noteType: "scratch",
    selectionType: "selection2link",
    noConfirm: true,
    flavor: "note",
  };
  this.timeout(TIMEOUT);

  beforeEach(function () {
    root = tmpDir();
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
  });

  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
  });

  test("basic", function (done) {
    onWSInit(async () => {
      const uri = vscode.Uri.file(path.join(vaultPath, "foo.md"));
      await vscode.window.showTextDocument(uri);
      await new LookupCommand().execute(lookupOpts);
      assert.ok(getActiveEditorBasename().startsWith("scratch"));
      done();
    });
    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      useCb: createOneNoteOneSchemaPresetCallback,
    });
  });

  test("add: childOfCurrent", function (done) {
    onWSInit(async () => {
      const uri = vscode.Uri.file(path.join(vaultPath, "foo.ch1.md"));
      await vscode.window.showTextDocument(uri);
      await new LookupCommand().execute(lookupOpts);
      assert.ok(getActiveEditorBasename().startsWith("foo.ch1.scratch"));
      done();
    });
    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      configOverride: {
        [CONFIG[`DEFAULT_${noteType}_ADD_BEHAVIOR` as ConfigKey].key]:
          "childOfCurrent",
      },
      useCb: createOneNoteOneSchemaPresetCallback,
    });
  });

  test("add: childOfDomain", function (done) {
    onWSInit(async () => {
      const uri = vscode.Uri.file(path.join(vaultPath, "foo.ch1.md"));
      await vscode.window.showTextDocument(uri);
      await new LookupCommand().execute(lookupOpts);
      assert.ok(getActiveEditorBasename().startsWith("foo.scratch"));
      done();
    });
    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      configOverride: {
        [CONFIG[`DEFAULT_${noteType}_ADD_BEHAVIOR` as ConfigKey].key]:
          "childOfDomain",
      },
      useCb: createOneNoteOneSchemaPresetCallback,
    });
  });
});

suite.skip("effect buttons", function () {
  let ctx: vscode.ExtensionContext;
  this.timeout(TIMEOUT);

  describe("copy note link", function () {
    beforeEach(function () {
      ctx = VSCodeUtils.getOrCreateMockContext();
      DendronWorkspace.getOrCreate(ctx);
    });

    test("basic", function (done) {
      setupCase2({ ctx }).then(async ({}) => {
        const engOpts: EngineOpts = { flavor: "note" };
        const lc = new LookupControllerV2(engOpts);
        await lc.show();
        const client = DendronWorkspace.instance().getEngine();
        const notes = ["foo", "foo.ch1"].map((fname) => client.notes[fname]);
        const items = notes.map((note) =>
          DNodeUtilsV2.enhancePropForQuickInput({
            props: note,
            schemas: client.schemas,
            vaults: DendronWorkspace.instance().config.vaults,
          })
        );
        lc.quickPick = createMockQuickPick({
          value: "foo",
          selectedItems: items,
        });
        (_.find(lc.state.buttons, {
          type: "multiSelect",
        }) as MultiSelectBtn).pressed = true;
        await lc.onTriggerButton(CopyNoteLinkButton.create(true));
        assert.strictEqual(
          clipboardy.readSync(),
          "[[Foo|foo]]\n[[Ch1|foo.ch1]]"
        );
        done();
      });
    });
  });
});

suite.skip("journal notes", function () {
  let root: DirResult;
  let ctx: vscode.ExtensionContext;
  let noteType = "JOURNAL";
  let lookupOpts: LookupCommandOpts = {
    noteType: "journal",
    noConfirm: true,
    flavor: "note",
  };
  this.timeout(TIMEOUT);

  beforeEach(function () {
    root = tmpDir();
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
  });

  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
  });

  test("basic", function (done) {
    onWSInit(async () => {
      const uri = vscode.Uri.file(path.join(vaultPath, "foo.ch1.md"));
      await vscode.window.showTextDocument(uri);
      await new LookupCommand().execute(lookupOpts);
      assert.ok(getActiveEditorBasename().startsWith("foo.journal"));
      done();
    });
    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      useCb: createOneNoteOneSchemaPresetCallback,
    });
  });

  test.skip("add: childOfDomainNamespace", function (done) {
    onWSInit(async () => {
      const uri = vscode.Uri.file(path.join(vaultPath, "foo.ch1.md"));
      await vscode.window.showTextDocument(uri);
      await new LookupCommand().execute(lookupOpts);
      assert.ok(getActiveEditorBasename().startsWith("foo.ch1.scratch"));
      done();
    });
    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      configOverride: {
        [CONFIG[`DEFAULT_${noteType}_ADD_BEHAVIOR` as ConfigKey].key]:
          "childOfDomainNamespace",
      },
      useCb: createOneNoteOneSchemaPresetCallback,
    });
  });

  test.skip("add: diff name", function (_done) {});

  // test creating a daily journal with no note open
  test("add: asOwnDomain", function (done) {
    onWSInit(async () => {
      await new LookupCommand().execute(lookupOpts);
      assert.ok(getActiveEditorBasename().startsWith("journal"));
      done();
    });
    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      configOverride: {
        [CONFIG[`DEFAULT_${noteType}_ADD_BEHAVIOR` as ConfigKey].key]:
          "asOwnDomain",
      },
      useCb: createOneNoteOneSchemaPresetCallback,
    });
  });

  test("add: childOfCurrent", function (done) {
    onWSInit(async () => {
      const uri = vscode.Uri.file(path.join(vaultPath, "foo.ch1.md"));
      await vscode.window.showTextDocument(uri);
      await new LookupCommand().execute(lookupOpts);
      assert.ok(getActiveEditorBasename().startsWith("foo.ch1.journal"));
      done();
    });
    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      configOverride: {
        [CONFIG[`DEFAULT_${noteType}_ADD_BEHAVIOR` as ConfigKey].key]:
          "childOfCurrent",
      },
      useCb: createOneNoteOneSchemaPresetCallback,
    });
  });

  test("add: childOfDomain", function (done) {
    onWSInit(async () => {
      const uri = vscode.Uri.file(path.join(vaultPath, "foo.ch1.md"));
      await vscode.window.showTextDocument(uri);
      await new LookupCommand().execute(lookupOpts);
      assert.ok(getActiveEditorBasename().startsWith("foo.journal"));
      done();
    });
    setupDendronWorkspace(root.name, ctx, {
      configOverride: {
        [CONFIG[`DEFAULT_${noteType}_ADD_BEHAVIOR` as ConfigKey].key]:
          "childOfDomain",
      },
      useCb: createOneNoteOneSchemaPresetCallback,
    });
  });
});
