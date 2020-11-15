import clipboardy from "@dendronhq/clipboardy";
import {
  DEngineClientV2,
  DNodePropsQuickInputV2,
  DNodeUtilsV2,
  DVault,
  SchemaUtilsV2,
} from "@dendronhq/common-all";
import { DirResult, file2Note, tmpDir } from "@dendronhq/common-server";
import {
  NodeTestPresetsV2,
  NodeTestUtilsV2,
  PLUGIN_CORE,
  SchemaTestPresetsV2,
} from "@dendronhq/common-test-utils";
import assert from "assert";
import _ from "lodash";
import { afterEach, beforeEach, describe } from "mocha";
import path from "path";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
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
import { EngineOpts } from "../../types";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { _activate } from "../../_extension";
import {
  createMockQuickPick,
  getActiveEditorBasename,
  onWSInit,
  setupDendronWorkspace,
  TIMEOUT,
} from "../testUtils";
import { getNoteFromTextEditor, setupCodeWorkspaceV2 } from "../testUtilsv2";

const { LOOKUP_SINGLE_TEST_PRESET } = PLUGIN_CORE;
// TODO: This could be cleaned up further+extended, but better for now
let vaultPath: string;
const createOneNoteOneSchemaPresetCallback = async (_vaultPath: string) => {
  vaultPath = _vaultPath;
  return NodeTestPresetsV2.createOneNoteOneSchemaPreset({
    vaultDir: vaultPath,
  });
};
const runAcceptItemTest = async (opts: {
  ctx: vscode.ExtensionContext;
  beforeActivateCb?: (opts: {
    vaults: DVault[];
    wsRoot: string;
  }) => Promise<void>;
  onInitCb: (opts: {
    lc: LookupControllerV2;
    lp: LookupProviderV2;
    wsRoot: string;
    vaults: DVault[];
  }) => Promise<void>;
}) => {
  // setup workspace
  const root = tmpDir();
  const ctx = opts.ctx;
  const wsRoot = root.name;
  const vault = { fsPath: tmpDir().name };
  const vaults = [vault];

  // setup test
  onInitForAccept({ onInitCb: opts.onInitCb, wsRoot, vaults });

  await setupDendronWorkspace(root.name, ctx, {
    useCb: async (vaultDir) => {
      await createOneNoteOneSchemaPresetCallback(vaultDir);
      if (opts.beforeActivateCb) {
        await opts.beforeActivateCb({
          wsRoot,
          vaults: [{ fsPath: vaultDir }],
        });
      }
    },
    vault,
  });
};

const onInitForAccept = async (opts: {
  onInitCb: (opts: {
    lc: LookupControllerV2;
    lp: LookupProviderV2;
    wsRoot: string;
    vaults: DVault[];
  }) => Promise<void>;
  wsRoot: string;
  vaults: DVault[];
}) => {
  onWSInit(async () => {
    const { onInitCb, wsRoot, vaults } = opts;
    const engOpts: EngineOpts = { flavor: "note" };
    const lc = new LookupControllerV2(engOpts);
    const lp = new LookupProviderV2(engOpts);
    await onInitCb({ lp, lc, wsRoot, vaults });
  });
};

suite("schemas", function () {
  let root: DirResult;
  let ctx: vscode.ExtensionContext;
  this.timeout(TIMEOUT);

  beforeEach(function () {
    root = tmpDir();
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
  });

  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
  });

  describe("updateItems", function () {
    const engOpts: EngineOpts = { flavor: "schema" };
    let ws: DendronWorkspace;
    let client: DEngineClientV2;

    test("root", function (done) {
      onWSInit(async () => {
        ws = DendronWorkspace.instance();
        client = ws.getEngine();
        const lc = new LookupControllerV2(engOpts);
        const lp = new LookupProviderV2(engOpts);
        const quickpick = await lc.show();
        quickpick.value = "root";

        await lp.onUpdatePickerItem(quickpick, engOpts, "manual");
        const schemaModules = _.map(
          lc.quickPick?.items,
          (ent) => client.schemas[ent.id]
        );
        _.map(
          await SchemaTestPresetsV2.createQueryRootResults(schemaModules),
          (ent) => {
            const { actual, expected, msg } = ent;
            assert.strictEqual(actual, expected, msg);
          }
        );
        done();
      });
      setupDendronWorkspace(root.name, ctx, {
        lsp: true,
        useCb: createOneNoteOneSchemaPresetCallback,
      });
    });

    test("all", function (done) {
      onWSInit(async () => {
        ws = DendronWorkspace.instance();
        client = ws.getEngine();
        const lc = new LookupControllerV2(engOpts);
        const lp = new LookupProviderV2(engOpts);
        const quickpick = await lc.show();
        quickpick.value = "";
        await lp.onUpdatePickerItem(quickpick, engOpts, "manual");
        const schemaModules = _.map(
          lc.quickPick?.items,
          (ent) => client.schemas[ent.id]
        );
        _.map(
          await SchemaTestPresetsV2.createQueryAllResults(schemaModules),
          (ent) => {
            const { actual, expected } = ent;
            assert.strictEqual(actual, expected);
          }
        );
        done();
      });
      setupDendronWorkspace(root.name, ctx, {
        lsp: true,
        useCb: createOneNoteOneSchemaPresetCallback,
      });
    });

    test("non-root", function (done) {
      onWSInit(async () => {
        ws = DendronWorkspace.instance();
        client = ws.getEngine();
        const lc = new LookupControllerV2(engOpts);
        const lp = new LookupProviderV2(engOpts);
        const quickpick = await lc.show();
        quickpick.value = "foo";
        await lp.onUpdatePickerItem(quickpick, engOpts, "manual");
        const schemaModules = _.map(
          lc.quickPick?.items,
          (ent) => client.schemas[ent.id]
        );
        _.map(
          await SchemaTestPresetsV2.createQueryNonRootResults(schemaModules),
          (ent) => {
            const { actual, expected, msg } = ent;
            assert.strictEqual(actual, expected, msg);
          }
        );
        done();
      });
      setupDendronWorkspace(root.name, ctx, {
        lsp: true,
        useCb: createOneNoteOneSchemaPresetCallback,
      });
    });
  });

  describe("onAccept", function () {
    const engOpts: EngineOpts = { flavor: "schema" };
    let ws: DendronWorkspace;
    let client: DEngineClientV2;
    let vault: DVault;

    test("root", function (done) {
      runAcceptItemTest({
        ctx,
        onInitCb: async ({ lp }) => {
          ws = DendronWorkspace.instance();
          client = ws.getEngine();
          const schemaModule = client.schemas["root"];
          const schemaInput = SchemaUtilsV2.enhanceForQuickInput({
            props: schemaModule,
            vaults: DendronWorkspace.instance().config.vaults,
          });
          const quickpick = createMockQuickPick({
            value: "root",
            selectedItems: [schemaInput],
          });
          await lp.onDidAccept(quickpick, engOpts);
          assert.strictEqual(
            path.basename(
              VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath as string
            ),
            "root.schema.yml"
          );
          done();
        },
      });
    });

    test("non-root", function (done) {
      runAcceptItemTest({
        ctx,
        onInitCb: async ({ lp }) => {
          ws = DendronWorkspace.instance();
          client = ws.getEngine();
          const schemaModule = client.schemas["foo"];
          const schemaInput = SchemaUtilsV2.enhanceForQuickInput({
            props: schemaModule,
            vaults: DendronWorkspace.instance().config.vaults,
          });
          const quickpick = createMockQuickPick({
            value: "foo",
            selectedItems: [schemaInput],
          });
          await lp.onDidAccept(quickpick, engOpts);
          assert.strictEqual(
            path.basename(
              VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath as string
            ),
            "foo.schema.yml"
          );
          done();
        },
      });
    });

    test("new", function (done) {
      runAcceptItemTest({
        ctx,
        onInitCb: async ({ lp }) => {
          ws = DendronWorkspace.instance();
          client = ws.getEngine();
          const quickpick = createMockQuickPick({
            value: "bar",
            selectedItems: [createNoActiveItem(vault)],
          });
          await lp.onDidAccept(quickpick, engOpts);
          assert.strictEqual(
            path.basename(
              VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath as string
            ),
            "bar.schema.yml"
          );
          done();
        },
      });

      // onWSInit(async () => {
      //   ws = DendronWorkspace.instance();
      //   client = ws.getEngine();
      //   const lp = new LookupProviderV2(engOpts);
      //   const quickpick = createMockQuickPick({
      //     value: "bar",
      //     selectedItems: [createNoActiveItem(vault)],
      //   });
      //   await lp.onDidAccept(quickpick, engOpts);
      //   assert.strictEqual(
      //     path.basename(
      //       VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath as string
      //     ),
      //     "bar.schema.yml"
      //   );
      //   done();
      // });
    });
  });
});

async function setupCase2({ ctx }: { ctx: vscode.ExtensionContext }) {
  const out = await setupCodeWorkspaceV2({
    ctx,
    initDirCb: createOneNoteOneSchemaPresetCallback,
  });
  await _activate(ctx);
  return out;
}

function setupCase1({
  ctx,
  wsRoot,
}: {
  ctx: vscode.ExtensionContext;
  wsRoot: string;
}) {
  return setupCodeWorkspaceV2({
    ctx,
    wsRoot,
    initDirCb: async (vaultPath) => {
      const vault = { fsPath: vaultPath };
      await NodeTestUtilsV2.createNotes({
        vaultPath,
        noteProps: [
          {
            id: "id.foo",
            fname: "foo",
            vault,
          },
          {
            id: "id.bar",
            fname: "bar",
            vault,
          },
        ],
      });
    },
  });
}

function setupCaseCustom({
  ctx,
  wsRoot,
  noteProps,
}: {
  ctx: vscode.ExtensionContext;
  wsRoot: string;
  noteProps: any;
}) {
  return setupCodeWorkspaceV2({
    ctx,
    wsRoot,
    initDirCb: async (vaultPath) => {
      await NodeTestUtilsV2.createNotes({
        vaultPath,
        noteProps: noteProps,
      });
    },
  });
}

suite("notes", function () {
  let root: DirResult;
  let ctx: vscode.ExtensionContext;
  this.timeout(TIMEOUT);

  beforeEach(function () {
    root = tmpDir();
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
  });

  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
  });

  const runUpdateItemTest = async (opts: {
    beforeActivateCb?: (opts: {
      vaults: DVault[];
      wsRoot: string;
    }) => Promise<void>;
    onInitCb: (opts: {
      lc: LookupControllerV2;
      lp: LookupProviderV2;
      quickpick: DendronQuickPickerV2;
    }) => Promise<void>;
  }) => {
    const { onInitCb } = opts;
    onInitForUpdateItems({ onInitCb });

    // setup workspace
    const wsRoot = root.name;

    await setupDendronWorkspace(root.name, ctx, {
      useCb: async (vaultDir) => {
        await createOneNoteOneSchemaPresetCallback(vaultDir);
        if (opts.beforeActivateCb) {
          await opts.beforeActivateCb({
            wsRoot,
            vaults: [{ fsPath: vaultDir }],
          });
        }
      },
    });
  };

  const onInitForUpdateItems = async (opts: {
    onInitCb: (opts: {
      lc: LookupControllerV2;
      lp: LookupProviderV2;
      quickpick: DendronQuickPickerV2;
    }) => Promise<void>;
  }) => {
    onWSInit(async () => {
      const { onInitCb } = opts;
      const engOpts: EngineOpts = { flavor: "note" };
      const lc = new LookupControllerV2(engOpts);
      const lp = new LookupProviderV2(engOpts);
      const quickpick = await lc.show();
      await onInitCb({ lp, quickpick, lc });
    });
  };

  describe("updateItems", function () {
    let vault: string;

    test("empty qs", function (done) {
      onWSInit(async () => {
        await VSCodeUtils.openFileInEditor(
          vscode.Uri.file(path.join(vault, "root.md"))
        );
        const engOpts: EngineOpts = { flavor: "note" };
        const lc = new LookupControllerV2(engOpts);
        const lp = new LookupProviderV2(engOpts);
        const quickpick = await lc.show();
        quickpick.value = "";
        await lp.onUpdatePickerItem(quickpick, engOpts, "manual");
        // two notes and root
        assert.equal(lc.quickPick?.items.length, 3);
        done();
      });
      setupCase1({ ctx, wsRoot: root.name }).then(({ vaults }) => {
        vault = vaults[0];
        _activate(ctx);
      });
    });

    // TODO: onDidChangeActive doesn't work when multiselection is enabled
    test("opened note", function (done) {
      onWSInit(async () => {
        const engOpts: EngineOpts = { flavor: "note" };
        const lc = new LookupControllerV2(engOpts);
        const lp = new LookupProviderV2(engOpts);
        await VSCodeUtils.openFileInEditor(
          vscode.Uri.file(path.join(root.name, "vault", "foo.md"))
        );
        const quickpick = await lc.show();
        quickpick.onDidChangeActive(() => {
          assert.equal(lc.quickPick?.activeItems.length, 1);
          assert.equal(lc.quickPick?.activeItems[0].fname, "foo");
          done();
        });
        await lp.onUpdatePickerItem(quickpick, engOpts, "manual");
      });
      setupCase1({ ctx, wsRoot: root.name }).then(() => {
        _activate(ctx);
      });
    });

    test("remove stub status after creation", function (done) {
      onWSInit(async () => {
        const engOpts: EngineOpts = { flavor: "note" };
        const lc = new LookupControllerV2(engOpts);
        const lp = new LookupProviderV2(engOpts);

        let quickpick = await lc.show();
        let note = _.find(quickpick.items, {
          fname: "foo",
        }) as DNodePropsQuickInputV2;
        assert.ok(note.stub);
        quickpick.selectedItems = [note];
        await lp.onDidAccept(quickpick, engOpts);
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
          // TODO
          // no schema file
          //assert.ok(note.schema?.id, Schema.createUnkownSchema().id);
          done();
        });
        quickpick.hide();
      });
      setupCaseCustom({
        ctx,
        wsRoot: root.name,
        noteProps: [
          {
            id: "id.foo.bar",
            fname: "foo.bar",
          },
        ],
      }).then(({ vaults }) => {
        vault = vaults[0];
        _activate(ctx);
      });
    });

    test("schema suggestion", function (done) {
      onWSInit(async () => {
        const engOpts: EngineOpts = { flavor: "note" };
        const lc = new LookupControllerV2(engOpts);
        const lp = new LookupProviderV2(engOpts);
        let quickpick = await lc.show();
        quickpick.value = "foo.";
        await lp.onUpdatePickerItem(quickpick, { flavor: "note" }, "manual");
        await NodeTestPresetsV2.runMochaHarness({
          results:
            LOOKUP_SINGLE_TEST_PRESET.UPDATE_ITEMS.SCHEMA_SUGGESTION.results,
          opts: { items: quickpick.items },
        });
        assert.deepStrictEqual(quickpick.items.length, 3);
        done();
      });

      setupDendronWorkspace(root.name, ctx, {
        lsp: true,
        useCb: async (vaultPath) => {
          await NodeTestPresetsV2.createOneNoteOneSchemaPreset({
            vaultDir: vaultPath,
          });
          await LOOKUP_SINGLE_TEST_PRESET.UPDATE_ITEMS.SCHEMA_SUGGESTION.before(
            { vault: { fsPath: vaultPath } }
          );
        },
      });
    });

    test("filter by depth", function (done) {
      runUpdateItemTest({
        beforeActivateCb: async ({ vaults }) => {
          const vault = vaults[0];
          NodeTestUtilsV2.createNote({
            vaultDir: vault.fsPath,
            noteProps: { fname: "foo.ch1.gch1", vault },
          });
        },
        onInitCb: async ({ lp, quickpick }) => {
          quickpick.value = "foo.";
          quickpick.showDirectChildrenOnly = true;
          await lp.onUpdatePickerItem(quickpick, { flavor: "note" }, "manual");
          assert.deepStrictEqual(quickpick.items.length, 3);
          assert.deepStrictEqual(
            _.find(quickpick.items, { fname: "foo.ch1.gch1" }),
            undefined
          );
          done();
        },
      });

      // onWSInit(async () => {
      //   const engOpts: EngineOpts = { flavor: "note" };
      //   const lc = new LookupControllerV2(engOpts);
      //   const lp = new LookupProviderV2(engOpts);
      //   let quickpick = await lc.show();
      //   quickpick.value = "foo.";
      //   quickpick.showDirectChildrenOnly = true;
      //   await lp.onUpdatePickerItem(quickpick, { flavor: "note" }, "manual");
      //   assert.deepStrictEqual(quickpick.items.length, 3);
      //   assert.deepStrictEqual(
      //     _.find(quickpick.items, { fname: "foo.ch1.gch1" }),
      //     undefined
      //   );
      //   done();
      // });

      // setupDendronWorkspace(root.name, ctx, {
      //   lsp: true,
      //   useCb: async (vaultDir) => {
      //     await NodeTestPresetsV2.createOneNoteOneSchemaPreset({
      //       vaultDir,
      //     });
      //     NodeTestUtilsV2.createNote({
      //       vaultDir,
      //       noteProps: { fname: "foo.ch1.gch1" },
      //     });
      //   },
      // });
    });

    // TODO: need to mock pressing a button
    test.skip("don't update note name if note button not pressed", function () {});

    //     test("attach schema after creation", function (done) {
    //       onWSInit(async () => {
    //         const ws = DendronWorkspace.instance();
    //         const engOpts: EngineOpts = { flavor: "note" };
    //         const lc = new LookupController(ws, engOpts);
    //         const lp = new LookupProvider(engOpts);

    //         let quickpick = lc.show();
    //         let note = _.find(quickpick.items, { fname: "foo" }) as Note;
    //         assert.ok(note.stub);
    //         quickpick.selectedItems = [note];
    //         await lp.onDidAccept(quickpick, engOpts);
    //         assert.equal(
    //           path.basename(
    //             VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath as string
    //           ),
    //           "foo.md"
    //         );

    //         quickpick = lc.show();
    //         note = _.find(quickpick.items, { fname: "foo" }) as Note;
    //         assert.ok(!note.stub);
    //         // no schema file
    //         assert.ok(note.schema?.id, "foo");
    //         done();
    //       });

    //       setupDendronWorkspace(root.name, ctx, {
    //         activateWorkspace: true,
    //         useCb: async (vaultPath: string) => {
    //           node2MdFile(new Note({ fname: "root", id: "root", title: "root" }), {
    //             root: vaultPath,
    //           });
    //           node2MdFile(new Note({ fname: "foo.bar" }), { root: vaultPath });
    //           const schemaPath = path.join(vaultPath, "foo.schema.yml");
    //           writeYAML(schemaPath, {
    //             version: 1,
    //             schemas: [
    //               {
    //                 id: "foo",
    //                 parent: "root",
    //               },
    //             ],
    //           });
    //         },
    //       });
    //     });
  });

  describe("onAccept", function () {
    const engOpts: EngineOpts = { flavor: "note" };
    let ws: DendronWorkspace;
    let client: DEngineClientV2;

    test("new node", function (done) {
      runAcceptItemTest({
        ctx,
        onInitCb: async ({ lp, vaults }) => {
          ws = DendronWorkspace.instance();
          client = ws.getEngine();
          const quickpick = createMockQuickPick({
            value: "bond",
            selectedItems: [createNoActiveItem(vaults[0])],
          });
          await lp.onDidAccept(quickpick, engOpts);
          assert.strictEqual(
            DNodeUtilsV2.fname(
              VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath as string
            ),
            "bond"
          );
          const txtPath = vscode.window.activeTextEditor?.document.uri
            .fsPath as string;
          const vault = { fsPath: path.dirname(txtPath) };
          const node = file2Note(txtPath, vault);
          assert.strictEqual(node.title, "Bond");
          done();
        },
      });
    });

    test("existing note", function (done) {
      runAcceptItemTest({
        ctx,
        onInitCb: async ({ lp }) => {
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
          await lp.onDidAccept(quickpick, engOpts);
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
        onInitCb: async ({ lp, vaults }) => {
          ws = DendronWorkspace.instance();
          client = ws.getEngine();
          const picker = createMockQuickPick({
            value: "bar.ns1.three",
            selectedItems: [createNoActiveItem(vaults[0])],
          });
          await lp.onUpdatePickerItem(picker, engOpts, "manual");
          await lp.onDidAccept(picker, engOpts);
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
        onInitCb: async ({ lp, vaults }) => {
          ws = DendronWorkspace.instance();
          client = ws.getEngine();
          const picker = createMockQuickPick({
            value: "bar.ns1.",
            selectedItems: [createNoActiveItem(vaults[0])],
          });
          await lp.onUpdatePickerItem(picker, engOpts, "manual");
          assert.deepStrictEqual(
            _.find(picker.items, { fname: "bar.ns1.three" })?.schema,
            { moduleId: "bar", schemaId: "three" }
          );
          picker.value = "bar.ns1.three";
          await lp.onDidAccept(picker, engOpts);
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
        onInitCb: async ({ lp, vaults }) => {
          ws = DendronWorkspace.instance();
          client = ws.getEngine();
          const picker = createMockQuickPick({
            value: "journal.2020.08.10",
            selectedItems: [createNoActiveItem(vaults[0])],
          });
          await lp.onUpdatePickerItem(picker, engOpts, "manual");
          await lp.onDidAccept(picker, engOpts);
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
        const lp = new LookupProviderV2(engOpts);
        await lp.onDidAccept(quickpick, engOpts);
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
        onInitCb: async ({ lp, vaults }) => {
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
          await lp.onDidAccept(quickpick, engOpts);
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

suite("selection2Link", function () {
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
      lsp: true,
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

suite("scratch notes", function () {
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

suite("effect buttons", function () {
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

suite("journal notes", function () {
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
      lsp: true,
      configOverride: {
        [CONFIG[`DEFAULT_${noteType}_ADD_BEHAVIOR` as ConfigKey].key]:
          "childOfDomain",
      },
      useCb: createOneNoteOneSchemaPresetCallback,
    });
  });
});
