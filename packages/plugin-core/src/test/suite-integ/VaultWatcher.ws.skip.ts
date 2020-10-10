// import {
//   DirResult,

//   FileTestUtils
// } from "@dendronhq/common-server";
// import {
//   NodeTestPresetsV2,
//   NoteTestPresetsV2
// } from "@dendronhq/common-test-utils";
// import assert from "assert";
// import fs from "fs-extra";
// import _ from "lodash";
// import { beforeEach } from "mocha";
// import path from "path";
// // // You can import and use all API from the 'vscode' module
// // // as well as import your extension to test it
// import * as vscode from "vscode";
// import { VSCodeUtils } from "../../utils";
// import { DendronWorkspace } from "../../workspace";
// import {
//   onWatcher,
//   onWSInit,
//   setupDendronWorkspace,
//   TIMEOUT
// } from "../testUtils";

// const NOTE_DELETE_PRESET =
//   NoteTestPresetsV2.presets.OneNoteOneSchemaPreset.delete;

// suite.skip("VaultWatcher", function () {
//   let root: DirResult;
//   let ctx: vscode.ExtensionContext;
//   let vaultPath: string;
//   this.timeout(TIMEOUT);

//   beforeEach(function () {
//     root = FileTestUtils.tmpDir();
//     ctx = VSCodeUtils.getOrCreateMockContext();
//     DendronWorkspace.getOrCreate(ctx);
//   });

//   test.skip(NOTE_DELETE_PRESET.noteNoChildren.label, (done) => {
//     onWatcher({
//       action: "delete",
//       cb: async () => {
//         const notes = DendronWorkspace.instance().getEngine().notes;
//         _.map(
//           await NOTE_DELETE_PRESET.noteNoChildren.results({
//             changed: [],
//             vaultDir: vaultPath,
//             notes,
//           }),
//           (ent) => {
//             assert.deepStrictEqual(ent.expected, ent.actual);
//           }
//         );
//         done();
//       },
//     });
//     onWSInit(async () => {
//       const notePath = path.join(vaultPath, "foo.ch1.md");
//       fs.removeSync(notePath);
//     });
//     setupDendronWorkspace(root.name, ctx, {
//       lsp: true,
//       useCb: async (vaultDir) => {
//         vaultPath = vaultDir;
//         await NodeTestPresetsV2.createOneNoteOneSchemaPreset({ vaultDir });
//       },
//     });
//   });
// });
