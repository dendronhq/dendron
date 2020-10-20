import {
  DEngineClientV2,
  DNodePropsQuickInputV2,
  DNodeUtilsV2,
  SchemaUtilsV2,
} from "@dendronhq/common-all";
import {
  DirResult,
  file2Note,
  FileTestUtils,
  NodeTestUtils,
} from "@dendronhq/common-server";
import {
  NodeTestPresetsV2,
  NodeTestUtilsV2,
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
import { LookupCommand, LookupCommandOpts } from "../../commands/LookupCommand";
import { LookupControllerV2 } from "../../components/lookup/LookupControllerV2";
import { EngineOpts } from "../../components/lookup/LookupProvider";
import { LookupProviderV2 } from "../../components/lookup/LookupProviderV2";
import { CONFIG, ConfigKey } from "../../constants";
import { HistoryService } from "../../services/HistoryService";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import {
  createMockQuickPick,
  getActiveEditorBasename,
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
        useCb: async (vaultPath) => {
          return NodeTestPresetsV2.createOneNoteOneSchemaPreset({
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
        useCb: async (vaultPath) => {
          return NodeTestPresetsV2.createOneNoteOneSchemaPreset({
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
        useCb: async (vaultPath) => {
          return NodeTestPresetsV2.createOneNoteOneSchemaPreset({
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
          return NodeTestPresetsV2.createOneNoteOneSchemaPreset({
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
          return NodeTestPresetsV2.createOneNoteOneSchemaPreset({
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
          return NodeTestPresetsV2.createOneNoteOneSchemaPreset({
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
        const quickpick = await lc.show();
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
        const quickpick = await lc.show();
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

        let quickpick = await lc.show();
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

        quickpick = await lc.show();
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
        let quickpick = await lc.show();
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
          await NodeTestPresetsV2.createOneNoteOneSchemaPreset({
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

  describe("onAccept", function () {
    const engOpts: EngineOpts = { flavor: "note" };
    let ws: DendronWorkspace;
    let client: DEngineClientV2;

    test("new node", function (done) {
      onWSInit(async () => {
        ws = DendronWorkspace.instance();
        client = ws.getEngine();
        const quickpick = createMockQuickPick({
          value: "bond",
        });
        const lp = new LookupProviderV2(engOpts);
        await lp.onDidAccept(quickpick, engOpts);
        assert.strictEqual(
          DNodeUtilsV2.fname(
            VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath as string
          ),
          "bond"
        );
        const txtPath = vscode.window.activeTextEditor?.document.uri
          .fsPath as string;
        const node = file2Note(txtPath);
        assert.strictEqual(node.title, "Bond");
        done();
      });
      setupDendronWorkspace(root.name, ctx, {
        lsp: true,
        useCb: async (vaultPath) => {
          return NodeTestPresetsV2.createOneNoteOneSchemaPreset({
            vaultDir: vaultPath,
          });
        },
      });
    });

    test("existing note", function (done) {
      onWSInit(async () => {
        ws = DendronWorkspace.instance();
        client = ws.getEngine();
        const note = client.notes["foo"];
        const item = DNodeUtilsV2.enhancePropForQuickInput(
          note,
          client.schemas
        );
        const quickpick = createMockQuickPick({
          value: "foo",
          selectedItems: [item],
        });
        const lp = new LookupProviderV2(engOpts);
        await lp.onDidAccept(quickpick, engOpts);
        assert.strictEqual(
          DNodeUtilsV2.fname(
            VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath as string
          ),
          "foo"
        );
        const txtPath = vscode.window.activeTextEditor?.document.uri
          .fsPath as string;
        const node = file2Note(txtPath);
        assert.strictEqual(node.title, "Foo");
        assert.strictEqual(node.created, "1");
        done();
      });
      setupDendronWorkspace(root.name, ctx, {
        lsp: true,
        useCb: async (vaultPath) => {
          return NodeTestPresetsV2.createOneNoteOneSchemaPreset({
            vaultDir: vaultPath,
          });
        },
      });
    });

    test("lookup new node with schema template", function (done) {
      onWSInit(async () => {
        ws = DendronWorkspace.instance();
        client = ws.getEngine();
        const lp = new LookupProviderV2(engOpts);
        const picker = createMockQuickPick({
          value: "bar.ns1.three",
        });
        await lp.onUpdatePickerItem(picker, engOpts, "manual");
        await lp.onDidAccept(picker, engOpts);
        const txtPath = vscode.window.activeTextEditor?.document.uri
          .fsPath as string;
        const node = file2Note(txtPath);
        assert.strictEqual(_.trim(node.body), "text from alpha template");
        done();
      });
      setupDendronWorkspace(root.name, ctx, {
        lsp: true,
        useCb: async (vaultDir: string) => {
          await NodeTestUtilsV2.createNote({
            vaultDir,
            noteProps: { body: "Template text", fname: "bar.one.temp" },
          });
          await NodeTestUtilsV2.createNote({
            vaultDir,
            noteProps: {
              body: "text from alpha template",
              fname: "bar.temp.alpha",
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
              }),
              SchemaUtilsV2.create({
                id: "one",
                template: { id: "bar.one.temp", type: "note" },
                children: ["alpha"],
              }),
              SchemaUtilsV2.create({ id: "alpha" }),
              SchemaUtilsV2.create({
                id: "three",
                template: { id: "bar.temp.alpha", type: "note" },
              }),
            ],
            fname: "bar",
          });
          return NodeTestPresetsV2.createOneNoteOneSchemaPreset({
            vaultDir,
          });
        },
      });
    });

    test("lookup new node with schema template from suggestion", function (done) {
      onWSInit(async () => {
        ws = DendronWorkspace.instance();
        client = ws.getEngine();
        const lp = new LookupProviderV2(engOpts);
        const picker = createMockQuickPick({
          value: "bar.ns1.",
        });
        await lp.onUpdatePickerItem(picker, engOpts, "manual");
        assert.deepStrictEqual(
          _.find(picker.items, { fname: "bar.ns1.three" })?.schema,
          { moduleId: "bar", schemaId: "three" }
        );
        picker.value = "bar.ns1.three";
        await lp.onDidAccept(picker, engOpts);
        const txtPath = vscode.window.activeTextEditor?.document.uri
          .fsPath as string;
        const node = file2Note(txtPath);
        assert.strictEqual(_.trim(node.body), "text from alpha template");
        done();
      });
      setupDendronWorkspace(root.name, ctx, {
        lsp: true,
        useCb: async (vaultDir: string) => {
          await NodeTestUtilsV2.createNote({
            vaultDir,
            noteProps: { body: "Template text", fname: "bar.one.temp" },
          });
          await NodeTestUtilsV2.createNote({
            vaultDir,
            noteProps: {
              body: "text from alpha template",
              fname: "bar.temp.alpha",
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
              }),
              SchemaUtilsV2.create({
                id: "one",
                template: { id: "bar.one.temp", type: "note" },
                children: ["alpha"],
              }),
              SchemaUtilsV2.create({ id: "alpha" }),
              SchemaUtilsV2.create({
                id: "three",
                template: { id: "bar.temp.alpha", type: "note" },
              }),
            ],
            fname: "bar",
          });
          return NodeTestPresetsV2.createOneNoteOneSchemaPreset({
            vaultDir,
          });
        },
      });
    });

    test("new node with schema template for namespace", function (done) {
      onWSInit(async () => {
        ws = DendronWorkspace.instance();
        client = ws.getEngine();
        const lp = new LookupProviderV2(engOpts);
        const picker = createMockQuickPick({
          value: "journal.2020.08.10",
        });
        await lp.onUpdatePickerItem(picker, engOpts, "manual");
        await lp.onDidAccept(picker, engOpts);
        const txtPath = vscode.window.activeTextEditor?.document.uri
          .fsPath as string;
        const node = file2Note(txtPath);
        assert.strictEqual(_.trim(node.body), "Template text");
        done();
      });
      setupDendronWorkspace(root.name, ctx, {
        lsp: true,
        useCb: async (vaultDir: string) => {
          await NodeTestUtilsV2.createNote({
            vaultDir,
            noteProps: { body: "Template text", fname: "journal.template" },
          });
          await NodeTestUtilsV2.createSchema({
            vaultDir,
            schemas: [
              SchemaUtilsV2.create({
                id: "journal",
                parent: "root",
                children: ["year"],
              }),
              SchemaUtilsV2.create({
                id: "year",
                pattern: "[0-2][0-9][0-9][0-9]",
                children: ["month"],
              }),
              SchemaUtilsV2.create({
                id: "month",
                pattern: "[0-9][0-9]",
                children: ["day"],
              }),
              SchemaUtilsV2.create({
                id: "day",
                pattern: "[0-9][0-9]",
                namespace: true,
                template: {
                  id: "journal.template",
                  type: "note",
                },
              }),
            ],
            fname: "journal",
          });
          return NodeTestPresetsV2.createOneNoteOneSchemaPreset({
            vaultDir,
          });
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

suite("scratch notes", function () {
  let root: DirResult;
  let ctx: vscode.ExtensionContext;
  let vaultPath: string;
  let noteType = "SCRATCH";
  let lookupOpts: LookupCommandOpts = {
    noteType: "scratch",
    selectionType: "selection2link",
    noConfirm: true,
    flavor: "note",
  };
  this.timeout(TIMEOUT);

  beforeEach(function () {
    root = FileTestUtils.tmpDir();
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
      useCb: async (_vaultPath) => {
        vaultPath = _vaultPath;
        return NodeTestPresetsV2.createOneNoteOneSchemaPreset({
          vaultDir: vaultPath,
        });
      },
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
      useCb: async (_vaultPath) => {
        vaultPath = _vaultPath;
        return NodeTestPresetsV2.createOneNoteOneSchemaPreset({
          vaultDir: vaultPath,
        });
      },
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
      useCb: async (_vaultPath) => {
        vaultPath = _vaultPath;
        return NodeTestPresetsV2.createOneNoteOneSchemaPreset({
          vaultDir: vaultPath,
        });
      },
    });
  });
});

suite("journal notes", function () {
  let root: DirResult;
  let ctx: vscode.ExtensionContext;
  let vaultPath: string;
  let noteType = "JOURNAL";
  let lookupOpts: LookupCommandOpts = {
    noteType: "journal",
    noConfirm: true,
    flavor: "note",
  };
  this.timeout(TIMEOUT);

  beforeEach(function () {
    root = FileTestUtils.tmpDir();
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
      useCb: async (_vaultPath) => {
        vaultPath = _vaultPath;
        return NodeTestPresetsV2.createOneNoteOneSchemaPreset({
          vaultDir: vaultPath,
        });
      },
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
      useCb: async (_vaultPath) => {
        vaultPath = _vaultPath;
        return NodeTestPresetsV2.createOneNoteOneSchemaPreset({
          vaultDir: vaultPath,
        });
      },
    });
  });

  test.skip("add: diff name", function (_done) {});
  test.skip("add: asOwnDomain", function (_done) {});

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
      useCb: async (_vaultPath) => {
        vaultPath = _vaultPath;
        return NodeTestPresetsV2.createOneNoteOneSchemaPreset({
          vaultDir: vaultPath,
        });
      },
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
      useCb: async (_vaultPath) => {
        vaultPath = _vaultPath;
        return NodeTestPresetsV2.createOneNoteOneSchemaPreset({
          vaultDir: vaultPath,
        });
      },
    });
  });
});
