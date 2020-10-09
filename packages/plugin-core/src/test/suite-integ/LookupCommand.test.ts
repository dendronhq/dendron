import {
  DEngineClientV2,
  DNodePropsQuickInputV2,
  DNodeUtilsV2,
} from "@dendronhq/common-all";
import {
  DirResult,
  FileTestUtils,
  NodeTestUtils,
} from "@dendronhq/common-server";
import {
  NodeTestPresetsV2,
  SchemaTestPresetsV2,
} from "@dendronhq/common-test-utils";
import assert from "assert";
import fs from "fs-extra";
import _ from "lodash";
import { afterEach, beforeEach, describe } from "mocha";
import path from "path";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { LookupControllerV2 } from "../../components/lookup/LookupControllerV2";
import { EngineOpts } from "../../components/lookup/LookupProvider";
import { LookupProviderV2 } from "../../components/lookup/LookupProviderV2";
import { HistoryService } from "../../services/HistoryService";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import {
  createMockQuickPick,
  onWSInit,
  setupDendronWorkspace,
  TIMEOUT,
} from "../testUtils";

suite("schemas", function () {
  let root: DirResult;
  let ctx: vscode.ExtensionContext;
  this.timeout(TIMEOUT);

  beforeEach(function () {
    root = FileTestUtils.tmpDir();
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
        const quickpick = lc.show();
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
        useCb: async (vaultPath) => {
          return NodeTestPresetsV2.createOneNoteoneSchemaPreset({
            vaultDir: vaultPath,
          });
        },
      });
    });

    test("all", function (done) {
      onWSInit(async () => {
        ws = DendronWorkspace.instance();
        client = ws.getEngine();
        const lc = new LookupControllerV2(engOpts);
        const lp = new LookupProviderV2(engOpts);
        const quickpick = lc.show();
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
        useCb: async (vaultPath) => {
          return NodeTestPresetsV2.createOneNoteoneSchemaPreset({
            vaultDir: vaultPath,
          });
        },
      });
    });

    test("non-root", function (done) {
      onWSInit(async () => {
        ws = DendronWorkspace.instance();
        client = ws.getEngine();
        const lc = new LookupControllerV2(engOpts);
        const lp = new LookupProviderV2(engOpts);
        const quickpick = lc.show();
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
        useCb: async (vaultPath) => {
          return NodeTestPresetsV2.createOneNoteoneSchemaPreset({
            vaultDir: vaultPath,
          });
        },
      });
    });
  });

  describe("onAccept", function () {
    const engOpts: EngineOpts = { flavor: "schema" };
    let ws: DendronWorkspace;
    let client: DEngineClientV2;

    test("root", function (done) {
      onWSInit(async () => {
        ws = DendronWorkspace.instance();
        client = ws.getEngine();
        const schemaModule = client.schemas["root"];
        const schema = schemaModule["root"];
        const schemaInput = DNodeUtilsV2.enhancePropForQuickInput(
          schema,
          client.schemas
        );
        const quickpick = createMockQuickPick({
          value: "root",
          selectedItems: [schemaInput],
        });
        const lp = new LookupProviderV2(engOpts);
        await lp.onDidAccept(quickpick, engOpts);
        assert.strictEqual(
          path.basename(
            VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath as string
          ),
          "root.schema.yml"
        );
        done();
      });
      setupDendronWorkspace(root.name, ctx, {
        lsp: true,
        useCb: async (vaultPath) => {
          return NodeTestPresetsV2.createOneNoteoneSchemaPreset({
            vaultDir: vaultPath,
          });
        },
      });
    });

    test("non-root", function (done) {
      onWSInit(async () => {
        ws = DendronWorkspace.instance();
        client = ws.getEngine();
        const schemaModule = client.schemas["foo"];
        const schema = schemaModule["root"];
        const schemaInput = DNodeUtilsV2.enhancePropForQuickInput(
          schema,
          client.schemas
        );
        const quickpick = createMockQuickPick({
          value: "foo",
          selectedItems: [schemaInput],
        });
        const lp = new LookupProviderV2(engOpts);
        await lp.onDidAccept(quickpick, engOpts);
        assert.strictEqual(
          path.basename(
            VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath as string
          ),
          "foo.schema.yml"
        );
        done();
      });
      setupDendronWorkspace(root.name, ctx, {
        lsp: true,
        useCb: async (vaultPath) => {
          return NodeTestPresetsV2.createOneNoteoneSchemaPreset({
            vaultDir: vaultPath,
          });
        },
      });
    });

    test("new", function (done) {
      onWSInit(async () => {
        ws = DendronWorkspace.instance();
        client = ws.getEngine();
        const lp = new LookupProviderV2(engOpts);
        const quickpick = createMockQuickPick({
          value: "bar",
          selectedItems: [lp.noActiveItem],
        });
        await lp.onDidAccept(quickpick, engOpts);
        assert.strictEqual(
          path.basename(
            VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath as string
          ),
          "bar.schema.yml"
        );
        done();
      });
      setupDendronWorkspace(root.name, ctx, {
        lsp: true,
        useCb: async (vaultPath) => {
          return NodeTestPresetsV2.createOneNoteoneSchemaPreset({
            vaultDir: vaultPath,
          });
        },
      });
    });
  });
});

suite("notes", function () {
  let root: DirResult;
  let ctx: vscode.ExtensionContext;
  this.timeout(TIMEOUT);

  beforeEach(function () {
    root = FileTestUtils.tmpDir();
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
  });

  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
  });

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
        const quickpick = lc.show();
        quickpick.value = "";
        await lp.onUpdatePickerItem(quickpick, engOpts, "manual");
        // two notes and root
        assert.equal(lc.quickPick?.items.length, 3);
        done();
      });

      setupDendronWorkspace(root.name, ctx, {
        lsp: true,
        useCb: async (vaultPath) => {
          vault = vaultPath;
          await NodeTestUtils.createNotes(vaultPath, [
            {
              id: "id.foo",
              fname: "foo",
            },
            {
              id: "id.bar",
              fname: "bar",
            },
          ]);
        },
      });
    });

    test("opened note", function (done) {
      onWSInit(async () => {
        const engOpts: EngineOpts = { flavor: "note" };
        const lc = new LookupControllerV2(engOpts);
        const lp = new LookupProviderV2(engOpts);
        await VSCodeUtils.openFileInEditor(
          vscode.Uri.file(path.join(root.name, "vault", "foo.md"))
        );
        const quickpick = lc.show();
        await lp.onUpdatePickerItem(quickpick, engOpts, "manual");
        quickpick.onDidChangeActive(() => {
          assert.equal(lc.quickPick?.activeItems.length, 1);
          assert.equal(lc.quickPick?.activeItems[0].fname, "foo");
          done();
        });
      });
      setupDendronWorkspace(root.name, ctx, {
        lsp: true,
        useCb: async (vaultPath) => {
          vault = vaultPath;
          return NodeTestUtils.createNotes(vaultPath, [
            {
              id: "id.foo",
              fname: "foo",
            },
            {
              id: "id.bar",
              fname: "bar",
            },
          ]);
        },
      });
    });

    test("remove stub status after creation", function (done) {
      onWSInit(async () => {
        const engOpts: EngineOpts = { flavor: "note" };
        const lc = new LookupControllerV2(engOpts);
        const lp = new LookupProviderV2(engOpts);

        let quickpick = lc.show();
        let note = _.find(quickpick.items, {
          fname: "foo",
        }) as DNodePropsQuickInputV2;
        assert.ok(note.stub);
        quickpick.selectedItems = [note];
        await lp.onDidAccept(quickpick, engOpts);
        assert.equal(
          path.basename(
            VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath as string
          ),
          "foo.md"
        );

        quickpick = lc.show();
        note = _.find(quickpick.items, {
          fname: "foo",
        }) as DNodePropsQuickInputV2;
        assert.ok(!note.stub);
        // TODO
        // no schema file
        //assert.ok(note.schema?.id, Schema.createUnkownSchema().id);
        done();
      });

      setupDendronWorkspace(root.name, ctx, {
        lsp: true,
        useCb: async (vaultPath) => {
          vault = vaultPath;
          return NodeTestUtils.createNotes(vaultPath, [
            {
              id: "id.foo.bar",
              fname: "foo.bar",
            },
          ]);
        },
      });
    });

    test("schema suggestion", function (done) {
      onWSInit(async () => {
        const engOpts: EngineOpts = { flavor: "note" };
        const lc = new LookupControllerV2(engOpts);
        const lp = new LookupProviderV2(engOpts);
        let quickpick = lc.show();
        quickpick.value = "foo.";
        await lp.onUpdatePickerItem(quickpick, { flavor: "note" }, "manual");
        assert.deepStrictEqual(quickpick.items.length, 3);
        assert.deepStrictEqual(
          _.pick(_.find(quickpick.items, { fname: "foo.ch1" }), [
            "fname",
            "schemaStub",
          ]),
          {
            fname: "foo.ch1",
            schemaStub: true,
          }
        );
        done();
      });

      setupDendronWorkspace(root.name, ctx, {
        lsp: true,
        useCb: async (vaultPath) => {
          await NodeTestPresetsV2.createOneNoteoneSchemaPreset({
            vaultDir: vaultPath,
          });
          fs.removeSync(path.join(vaultPath, "foo.ch1.md"));
        },
      });
    });

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
});

// suite("Scratch Notes", function () {
//   let root: DirResult;
//   let ctx: vscode.ExtensionContext;
//   this.timeout(TIMEOUT);

//   beforeEach(function () {
//     root = FileTestUtils.tmpDir();
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
