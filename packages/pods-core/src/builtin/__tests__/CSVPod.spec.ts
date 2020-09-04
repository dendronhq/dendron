// import { ExportPod } from "../CSVPod";
// import {
//   EngineTestUtils,
//   node2MdFile,
//   FileTestUtils,
// } from "@dendronhq/common-server";
// import { Note, NoteRawProps } from "@dendronhq/common-all";
// import { URI } from "vscode-uri";
// import path from "path";
// import fs from "fs";

// const createNotes = (vaultPath: string, notes: Partial<NoteRawProps>[]) => {
//   node2MdFile(new Note({ fname: "root", id: "root", title: "root" }), {
//     root: vaultPath,
//   });
//   notes.map((n) => {
//     // @ts-ignore
//     node2MdFile(new Note(n), {
//       root: vaultPath,
//     });
//   });
// };

// function setup(opts: { notes: Partial<NoteRawProps>[] }) {
//   return EngineTestUtils.setupStoreDir({
//     copyFixtures: false,
//     initDirCb: (dirPath: string) => {
//       createNotes(dirPath, opts.notes);
//     },
//   });
// }

// describe("ExportPod", () => {
//   let root: string;
//   beforeEach(() => {
//     // engine = DendronEngine.getOrCreateEngine({
//     //   root,
//     //   forceNew: true,
//     //   mode: "exact",
//     // });
//   });
//   test("basic", async () => {
//     root = await setup({ notes: [{ fname: "foo" }, { fname: "bar" }] });
//     const pod = new ExportPod({ roots: [root] });
//     const mode = "notes";
//     const metaOnly = false;
//     const destDir = FileTestUtils.tmpDir().name;
//     const destPath = path.join(destDir, "export.csv");
//     const config = { dest: URI.file(destPath) };
//     await pod.plant({ mode, metaOnly, config });
//     expect(fs.readFileSync(destPath)).toMatchSnapshot();
//   });
// });
