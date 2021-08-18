// import { DNodeUtils, DVault, NoteProps } from "@dendronhq/common-all";
// import { file2Note } from "@dendronhq/common-server";
// import { NodeTestPresetsV2, PLUGIN_CORE } from "@dendronhq/common-test-utils";
// import fs from "fs-extra";
// import _ from "lodash";
// import { describe } from "mocha";
// import path from "path";
// // // You can import and use all API from the 'vscode' module
// // // as well as import your extension to test it
// import * as vscode from "vscode";
// import { CancellationToken } from "vscode-languageclient";
// import { LookupControllerV2 } from "../../components/lookup/LookupControllerV2";
// import { LookupProviderV2 } from "../../components/lookup/LookupProviderV2";
// import { DendronQuickPickerV2 } from "../../components/lookup/types";
// import { NotePickerUtils } from "../../components/lookup/utils";
// import { EngineOpts } from "../../types";
// import { VSCodeUtils } from "../../utils";
// import { DendronWorkspace } from "../../workspace";
// import { _activate } from "../../_extension";
// import { createMockQuickPick, onWSInit, TIMEOUT } from "../testUtils";
// import {
//   expect,
//   getNoteFromTextEditor,
//   setupCodeWorkspaceMultiVaultV2,
// } from "../testUtilsv2";
// import { setupBeforeAfter } from "../testUtilsV3";

// const { LOOKUP_SINGLE_TEST_PRESET } = PLUGIN_CORE;
// const { createNoActiveItem } = NotePickerUtils;

// // suite("Lookup Schema, Multi/", function () {
// //   let ctx: vscode.ExtensionContext;
// //   this.timeout(TIMEOUT);

// //   beforeEach(function () {
// //     ctx = VSCodeUtils.getOrCreateMockContext();
// //     DendronWorkspace.getOrCreate(ctx);
// //     VSCodeUtils.closeAllEditors();
// //   });

// //   afterEach(function () {
// //     HistoryService.instance().clearSubscriptions();
// //     VSCodeUtils.closeAllEditors();
// //   });

// //   test.skip("basics", function (done) {
// //     runMultiVaultTest({
// //       ctx,
// //       onInit: async ({ vaults, wsRoot }) => {
// //         const engine = DendronWorkspace.instance().getEngine();
// //         await SCHEMAS.WRITE.BASICS.postSetupHook({ wsRoot, vaults, engine });
// //         await runMochaHarness(SCHEMAS.WRITE.BASICS.results, { engine });
// //         done();
// //       },
// //     });
// //   });
// // });

// suite.skip("Lookup notes, multi", function () {
//   let wsRoot: string;
//   let vaults: DVault[];
//   let ctx: vscode.ExtensionContext;
//   const engOpts: EngineOpts = { flavor: "note" };
//   let token: CancellationToken;
//   this.timeout(TIMEOUT);

//   ctx = setupBeforeAfter(this, {
//     beforeHook: () => {
//       token = new vscode.CancellationTokenSource().token;
//     },
//   });

//   const runUpdateItemTest = async (opts: {
//     beforeActivateCb?: (opts: {
//       vaults: DVault[];
//       wsRoot: string;
//     }) => Promise<void>;
//     onInitCb: (opts: {
//       lc: LookupControllerV2;
//       lp: LookupProviderV2;
//       quickpick: DendronQuickPickerV2;
//     }) => Promise<void>;
//   }) => {
//     const { onInitCb } = opts;
//     onInitForUpdateItems({ onInitCb });
//     const { wsRoot: _wsRoot, vaults: _vaults } =
//       await setupCodeWorkspaceMultiVaultV2({ ctx });
//     wsRoot = _wsRoot;
//     vaults = _vaults;
//     await VSCodeUtils.closeAllEditors();
//     if (opts.beforeActivateCb) {
//       await opts.beforeActivateCb({ wsRoot, vaults });
//     }
//     await _activate(ctx);
//   };

//   const runAcceptItemTest = async (opts: {
//     beforeActivateCb?: (opts: {
//       vaults: DVault[];
//       wsRoot: string;
//     }) => Promise<void>;
//     onInitCb: (opts: {
//       lc: LookupControllerV2;
//       lp: LookupProviderV2;
//     }) => Promise<void>;
//   }) => {
//     console.log("runAcceptItemTest:enter");
//     const { onInitCb } = opts;
//     onInitForAcceptItems({ onInitCb });
//     const {
//       wsRoot: _wsRoot,
//       vaults: _vaults,
//       workspaceFolders,
//     } = await setupCodeWorkspaceMultiVaultV2({
//       ctx,
//       configOverride: {
//         //"dendron.serverPort": 3005
//       },
//     });
//     console.log(
//       "runAcceptItemTest:setupCodeWorkspaceV2",
//       JSON.stringify({ vaults, workspaceFolders })
//     );
//     wsRoot = _wsRoot;
//     vaults = _vaults;
//     if (opts.beforeActivateCb) {
//       await opts.beforeActivateCb({ wsRoot, vaults });
//     }
//     console.log("runAcceptItemTest:pre_activate");
//     await _activate(ctx);
//     console.log("runAcceptItemTest:post_activate");
//   };

//   const onInitForUpdateItems = async (opts: {
//     onInitCb: (opts: {
//       lc: LookupControllerV2;
//       lp: LookupProviderV2;
//       quickpick: DendronQuickPickerV2;
//     }) => Promise<void>;
//   }) => {
//     onWSInit(async () => {
//       const { onInitCb } = opts;
//       const engOpts: EngineOpts = { flavor: "note" };
//       const lc = new LookupControllerV2(engOpts);
//       const lp = new LookupProviderV2(engOpts);
//       const quickpick = await lc.show();
//       await onInitCb({ lp, quickpick, lc });
//     });
//   };

//   const onInitForAcceptItems = async (opts: {
//     onInitCb: (opts: {
//       lc: LookupControllerV2;
//       lp: LookupProviderV2;
//     }) => Promise<void>;
//   }) => {
//     onWSInit(async () => {
//       const { onInitCb } = opts;
//       const engOpts: EngineOpts = { flavor: "note" };
//       const lc = new LookupControllerV2(engOpts);
//       const lp = new LookupProviderV2(engOpts);
//       await onInitCb({ lp, lc });
//     });
//   };

//   describe("updateItems", () => {
//     test("empty qs", (done) => {
//       runUpdateItemTest({
//         onInitCb: async ({ quickpick, lp, lc }) => {
//           quickpick.value = "";
//           await lp.onUpdatePickerItem(quickpick, engOpts, "manual", token);
//           expect(lc.quickPick?.items.length).toEqual(4);
//           done();
//         },
//       });
//     });

//     test("opened note", (done) => {
//       runUpdateItemTest({
//         onInitCb: async ({ quickpick, lp, lc }) => {
//           await VSCodeUtils.openFileInEditor(
//             vscode.Uri.file(path.join(vaults[0].fsPath, "foo.md"))
//           );
//           quickpick.value = "";
//           await lp.onUpdatePickerItem(quickpick, engOpts, "manual", token);
//           quickpick.onDidChangeActive(() => {
//             expect(lc.quickPick?.activeItems.length).toEqual(1);
//             expect(lc.quickPick?.activeItems[0].fname).toEqual("foo");
//             done();
//           });
//         },
//       });
//     });

//     test("schema suggestion", (done) => {
//       runUpdateItemTest({
//         onInitCb: async ({ quickpick, lp }) => {
//           quickpick.value = "foo.";
//           await lp.onUpdatePickerItem(
//             quickpick,
//             { flavor: "note" },
//             "manual",
//             token
//           );
//           expect(quickpick.items.length).toEqual(4);
//           expect(
//             _.pick(_.find(quickpick.items, { fname: "foo.ch1" }), [
//               "fname",
//               "schemaStub",
//             ])
//           ).toEqual({
//             fname: "foo.ch1",
//             schemaStub: true,
//           });
//           done();
//         },
//         beforeActivateCb: async ({ vaults }) => {
//           fs.removeSync(path.join(vaults[0].fsPath, "foo.ch1.md"));
//         },
//       });
//     });
//   });

//   describe("accept items", () => {
//     test("exiting item", (done) => {
//       runAcceptItemTest({
//         onInitCb: async ({ lp, lc }) => {
//           const ws = DendronWorkspace.instance();
//           const client = ws.getEngine();
//           const note = client.notes["foo"];
//           const item = DNodeUtils.enhancePropForQuickInput({
//             wsRoot: DendronWorkspace.wsRoot(),
//             props: note,
//             schemas: client.schemas,
//             vaults: DendronWorkspace.instance().config.vaults,
//           });
//           const quickpick = createMockQuickPick({
//             value: "foo",
//             selectedItems: [item],
//           });
//           await lp.onDidAccept({ picker: quickpick, opts: engOpts, lc });
//           await NodeTestPresetsV2.runMochaHarness({
//             opts: {
//               activeFileName: DNodeUtils.fname(
//                 VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath as string
//               ),
//               activeNote: getNoteFromTextEditor(),
//             },
//             results:
//               LOOKUP_SINGLE_TEST_PRESET.ACCEPT_ITEMS.EXISTING_ITEM.results,
//           });
//           done();
//         },
//       });
//     });

//     test("new item", (done) => {
//       runAcceptItemTest({
//         onInitCb: async ({ lp, lc }) => {
//           console.log("onInitCb:enter");
//           const ws = DendronWorkspace.instance();
//           const client = ws.getEngine();
//           const note = client.notes["foo"];
//           await VSCodeUtils.openFileInEditor(
//             vscode.Uri.file(path.join(note.vault.fsPath, note.fname + ".md"))
//           );
//           const quickpick = createMockQuickPick({
//             value: "bond",
//             selectedItems: [createNoActiveItem(vaults[0])],
//           });
//           await lp.onDidAccept({ picker: quickpick, opts: engOpts, lc });
//           expect(
//             DNodeUtils.fname(
//               VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath as string
//             )
//           ).toEqual("bond");
//           const txtPath = vscode.window.activeTextEditor?.document.uri
//             .fsPath as string;
//           const vault = { fsPath: path.dirname(txtPath) };
//           const node = file2Note(txtPath, vault);
//           expect(node.title).toEqual("Bond");
//           console.log("onInitCb:exit");
//           done();
//         },
//       });
//     });

//     test("new item in other", (done) => {
//       runAcceptItemTest({
//         onInitCb: async ({ lp, lc }) => {
//           console.log("onInitCb:enter");
//           const ws = DendronWorkspace.instance();
//           const vaults = DendronWorkspace.instance().vaultsv4;
//           const client = ws.getEngine();
//           const note = _.find(client.notes, (ent) => {
//             return (
//               ent.vault.fsPath === vaults[1].fsPath && ent.fname === "root"
//             );
//           }) as NoteProps;
//           await VSCodeUtils.openFileInEditor(
//             vscode.Uri.file(path.join(note.vault.fsPath, note.fname + ".md"))
//           );
//           const quickpick = createMockQuickPick({
//             value: "bond",
//             selectedItems: [createNoActiveItem(vaults[0])],
//           });
//           await lp.onDidAccept({ picker: quickpick, opts: engOpts, lc });
//           expect(
//             DNodeUtils.fname(
//               VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath as string
//             )
//           ).toEqual("bond");
//           const txtPath = vscode.window.activeTextEditor?.document.uri
//             .fsPath as string;
//           const vault = { fsPath: path.dirname(txtPath) };
//           const node = file2Note(txtPath, vault);
//           expect(node.title).toEqual("Bond");
//           console.log("onInitCb:exit");
//           done();
//         },
//       });
//     });
//   });
// });
