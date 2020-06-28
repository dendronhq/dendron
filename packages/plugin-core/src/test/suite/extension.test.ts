// import * as assert from "assert";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
// import * as vscode from "vscode";

// import { afterEach, before, beforeEach, describe } from "mocha";

// import { DendronFileSystemProvider } from "../../components/fsProvider";
// import _ from "lodash";
// import { fnameToUri } from "../../components/lookup/utils";
// import fs from "fs-extra";
// import path from "path";
// import { testUtils } from "@dendronhq/common-server";

// class DevWorkspaceUtils {
//   static getRootDir() {
//     // TODO: go up until you find lerna.json
//     return path.join(__dirname, "../../../../../");
//   }
//   static getFixturesDir() {
//     return path.join(this.getRootDir(), "fixtures");
//   }
// }

// async function setup() {
//   const fixtures = DevWorkspaceUtils.getFixturesDir();
//   const storeDir = path.join(fixtures, "store");
//   const testRoot = testUtils.setupTmpDendronDir({
//     fixturesDir: storeDir,
//     tmpDir: "/tmp/dendron/plugin-core",
//   });
//   const fsp = await DendronFileSystemProvider.getOrCreate();
//   await fsp.initialize({ root: testRoot });
//   vscode.workspace.updateWorkspaceFolders(0, 0, {
//     uri: vscode.Uri.parse("denfs:/"),
//     name: "Dendron",
//   });
//   console.log({ testRoot });
//   return { fsp, testRoot };
// }

// function genExpectedFiles(): string[] {
//   return ["foo.md", "foo.one.md", "foo.schema.yml", "foo.two.md", "root.md"];
// }

// async function checkSingleAddition(
//   _assert: typeof assert,
//   fsp: DendronFileSystemProvider,
//   testRoot: string,
//   fname: string
// ) {
//   const uri = await fnameToUri(fname, { checkIfDirectoryFile: false });
//   await fsp.writeFile(uri, Buffer.from(`${fname}.body`), {
//     create: true,
//     overwrite: true,
//     writeToEngine: true,
//   });
//   checkFiles(assert, testRoot, { additions: [fname] });
// }

// function checkFiles(
//   _assert: typeof assert,
//   testRoot: string,
//   opts: { additions?: string[] }
// ) {
//   const cleanOpts = _.defaults(opts, { additions: [] });
//   const dirEnts = fs.readdirSync(testRoot);
//   _assert.deepEqual(
//     dirEnts.sort(),
//     genExpectedFiles()
//       .concat(_.map(cleanOpts.additions, (ent) => `${ent}.md`))
//       .sort()
//   );
// }

// suite("Extension Test Suite", () => {
//   vscode.window.showInformationMessage("Start all tests.");

//   before(async () => {
//     const fsp = await DendronFileSystemProvider.getOrCreate({
//       initializeEngine: false,
//     });
//     vscode.workspace.registerFileSystemProvider("denfs", fsp, {
//       isCaseSensitive: true,
//     });
//   });

//   describe("DendronFileSystemProvider", () => {
//     let fsp: DendronFileSystemProvider;
//     let testRoot: string;
//     beforeEach(async () => {
//       ({ fsp, testRoot } = await setup());
//     });
//     afterEach(() => {
//       fs.removeSync(testRoot);
//     });

//     describe("create new", () => {
//       describe("parent: root", () => {
//         test("child: root/domain", async () => {
//           const uri = await fnameToUri("baz", { checkIfDirectoryFile: false });
//           await fsp.writeFile(uri, Buffer.from("baz.body"), {
//             create: true,
//             overwrite: true,
//             writeToEngine: true,
//           });
//           const note = _.find(fsp.engine.notes, { fname: "baz" });
//           checkFiles(assert, testRoot, { additions: ["baz"] });
//           assert.ok(!_.isUndefined(note));
//         });

//         test("grandchild, node: root/domain/node", async () => {
//           const fname = "foo.three";
//           const uri = await fnameToUri(fname, { checkIfDirectoryFile: false });
//           await fsp.writeFile(uri, Buffer.from(`${fname}.body`), {
//             create: true,
//             overwrite: true,
//             writeToEngine: true,
//           });
//           checkFiles(assert, testRoot, { additions: [fname] });
//         });

//         test("grandchild, stub: root/stub/node", async () => {
//           const fname = "baz.one";
//           const uri = await fnameToUri(fname, { checkIfDirectoryFile: false });
//           await fsp.writeFile(uri, Buffer.from(`${fname}.body`), {
//             create: true,
//             overwrite: true,
//             writeToEngine: true,
//           });
//           checkFiles(assert, testRoot, { additions: [fname] });
//         });
//       });

//       describe("parent: domain", () => {
//         test("child: domain/node", async () => {
//           await checkSingleAddition(assert, fsp, testRoot, "foo.three");
//         });

//         test("grandchild, stub: domain/stub/node", async () => {
//           await checkSingleAddition(assert, fsp, testRoot, "foo.beta.one");
//         });

//         test("grandchild, node: domain/node/node", async () => {
//           await checkSingleAddition(assert, fsp, testRoot, "foo.alpha.three");
//         });
//       });

//       describe.only("edge", () => {
//         test("(grandchild,stub), (child, node)", async () => {
//           await checkSingleAddition(assert, fsp, testRoot, "foo.beta.one");
//           await checkSingleAddition(assert, fsp, testRoot, "foo.beta");
//         });
//       });
//     });
//   });
// });
