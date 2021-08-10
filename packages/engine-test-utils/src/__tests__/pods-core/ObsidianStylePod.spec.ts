// import { tmpDir } from "@dendronhq/common-server";
// import { FileTestUtils } from "@dendronhq/common-test-utils";
// import { ObsidianStyleImportPod } from "@dendronhq/pods-core";
// import fs, { ensureDirSync } from "fs-extra";

// import _ from "lodash";
// import path from "path";
// import { runEngineTestV5, WorkspaceOpts } from "../../engine";
// import { checkString } from "../../utils";

// const obsidianCSS = `.graph-view.color-fill {
// 	color: red;
// 	opacity: 0.5;
// }

// /* .graph-view.color-fill-tag {
// 	color: red;
// } */

// /* .graph-view.color-fill-attachment {
// 	color: red;
// } */

// /* .graph-view.color-arrow {
// 	color: red;
// } */

// .graph-view.color-circle {
// 	color: maroon;
// }

// .graph-view.color-line {
// 	color: blue;
// 	opacity: 0.6;
// }

// .graph-view.color-text {
// 	color: aqua;
// 	opacity: 0.7;
// }

// .graph-view.color-fill-highlight {
// 	color: purple;
// 	opacity: 0.8;
// }

// .unrelated-class {
// 	color: blue;
// }

// /* .graph-view.color-line-highlight {
// 	color: red;
// } */

// /* .graph-view.color-fill-unresolved {
// 	color: red;
// } */`

// const setupBasic = async (opts: WorkspaceOpts) => {
//   const { wsRoot } = opts;

//   ensureDirSync(wsRoot)
//   fs.writeFileSync(path.join(wsRoot, 'obsidian.css'), obsidianCSS)
// };

// describe("obsidian import pod", () => {
//   let exportDest: string;

//   beforeAll(() => {
//     exportDest = tmpDir().name;
//   });

//   test("all supported properties", async () => {
//     await runEngineTestV5(
//       async ({ engine, vaults, wsRoot }) => {
//         const pod = new ObsidianStyleImportPod();
//         engine.config.useFMTitle = true;

//         await pod.execute({
//           engine,
//           vaults,
//           wsRoot,
//         });

//         // check that graphviz file is created
//         const [expectedFiles, actualFiles] = FileTestUtils.cmpFiles(exportDest, [
//           "graphviz.dot",
//         ]);
//         expect(expectedFiles).toEqual(actualFiles);

//         // check contents of graphviz file
//         const dotFile = fs.readFileSync(path.join(exportDest, "graphviz.dot"), {
//           encoding: "utf8",
//         });

//         // Check for:
//         // 1. start of file -> "graph {"
//         // 2. existence of a note -> "note_"
//         // 3. a labeled note -> "[label=\""
//         // 4. a connection -> "--"
//         // 5. end of graph -> "}"
//         await checkString(dotFile, "graph {", "note_", '[label="', "--", "}");
//       },
//       { expect, preSetupHook: setupBasic }
//     );
//   });
// });
