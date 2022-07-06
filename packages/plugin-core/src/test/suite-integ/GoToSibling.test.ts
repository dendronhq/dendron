import { DVault, WorkspaceOpts } from "@dendronhq/common-all";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { before } from "mocha";
import { GoToSiblingCommand } from "../../commands/GoToSiblingCommand";
import { IDendronExtension } from "../../dendronExtensionInterface";
import { ExtensionProvider } from "../../ExtensionProvider";
import { VSCodeUtils } from "../../vsCodeUtils";
import { WSUtilsV2 } from "../../WSUtilsV2";
import { expect } from "../testUtilsv2";
import { describeMultiWS, describeSingleWS } from "../testUtilsV3";

const getActiveDocumentFname = () =>
  VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath;

const createNoteForVault = async (wsRoot: string, vault: DVault) => {
  await NoteTestUtilsV4.createNote({
    fname: "foo.journal.2020.08",
    wsRoot,
    vault,
    // props: { traits: ["journalNote"] },
  });

  await NoteTestUtilsV4.createNote({
    fname: "foo.journal.2020.09",
    wsRoot,
    vault,
    // props: { traits: ["journalNote"] },
  });

  await NoteTestUtilsV4.createNote({
    fname: "foo.journal.2020.08.29",
    wsRoot,
    vault,
    // props: { traits: ["journalNote"] },
  });

  await NoteTestUtilsV4.createNote({
    fname: "foo.journal.2020.08.30",
    wsRoot,
    vault,
    // props: { traits: ["journalNote"] },
  });

  await NoteTestUtilsV4.createNote({
    fname: "foo.journal.2020.08.31",
    wsRoot,
    vault,
    // props: { traits: ["journalNote"] },
  });

  await NoteTestUtilsV4.createNote({
    fname: "foo.journal.2020.09.01",
    wsRoot,
    vault,
    // props: { traits: ["journalNote"] },
  });

  const base = "foo.journal.2021.04";
  const fnames = ["3", "zlob", "29", "baz", "300", "bar"].map((leaf) =>
    [base, leaf].join(".")
  );

  for (const fname of fnames) {
    await NoteTestUtilsV4.createNote({
      fname,
      wsRoot,
      vault,
    });
  }

  await NoteTestUtilsV4.createNote({
    fname: "random.note.without.siblings",
    wsRoot,
    vault,
  });

  await NoteTestUtilsV4.createNote({
    fname: "gamma",
    wsRoot,
    vault,
  });
};

const createNotesForMultiWorkspace = async ({
  wsRoot,
  vaults,
}: WorkspaceOpts) => {
  for (const vault of vaults) {
    await createNoteForVault(wsRoot, vault);
  }
};

const beforeTestResuts = async (
  ext: IDendronExtension,
  fname: string,
  vault?: DVault
) => {
  const { engine } = ext.getDWorkspace();
  console.log(
    "notes",
    Object.values(engine.notes)
      .map((note) => note.fname)
      .sort()
  );
  const hitNotes = await engine.findNotes({ fname, vault });
  if (hitNotes.length === 0) throw Error("Cannot find the active note");
  await new WSUtilsV2(ext).openNote(hitNotes[0]);
};

suite("GoToSibling", () => {
  describeSingleWS(
    "When GoToSibling is invoked",
    {
      postSetupHook: async ({ wsRoot, vaults }) =>
        await createNoteForVault(wsRoot, vaults[0]),
    },
    () => {
      let ext: IDendronExtension;

      before(() => {
        ext = ExtensionProvider.getExtension();
      });

      test("basic", async () => {
        await beforeTestResuts(ext, "foo.journal.2020.08.29");
        const resp = await new GoToSiblingCommand().execute({
          direction: "next",
        });
        expect(resp).toEqual({ msg: "ok" });
        expect(
          getActiveDocumentFname()?.endsWith("foo.journal.2020.08.30.md")
        ).toBeTruthy();
      });

      test("traversal from parent", async () => {
        await beforeTestResuts(ext, "foo.journal.2020.08");
        const resp = await new GoToSiblingCommand().execute({
          direction: "next",
        });
        expect(resp).toEqual({ msg: "ok" });
        expect(
          getActiveDocumentFname()?.endsWith("foo.journal.2020.09.md")
        ).toBeTruthy();
      });

      test("go over index", async () => {
        await beforeTestResuts(ext, "foo.journal.2020.08.31");
        const resp = await new GoToSiblingCommand().execute({
          direction: "next",
        });
        expect(resp).toEqual({ msg: "ok" });
        expect(
          getActiveDocumentFname()?.endsWith("foo.journal.2020.08.29.md")
        ).toBeTruthy();
      });

      test("numeric siblings sort correctly", async () => {
        await beforeTestResuts(ext, "foo.journal.2020.08.29");
        const resp1 = await new GoToSiblingCommand().execute({
          direction: "next",
        });
        expect(resp1).toEqual({ msg: "ok" });
        expect(
          getActiveDocumentFname()?.endsWith("foo.journal.2020.08.30.md")
        ).toBeTruthy();
        const resp2 = await new GoToSiblingCommand().execute({
          direction: "next",
        });
        expect(resp2).toEqual({ msg: "ok" });
        expect(
          getActiveDocumentFname()?.endsWith("foo.journal.2020.08.31.md")
        ).toBeTruthy();
      });

      test("numeric and alphabetic siblings", async () => {
        await beforeTestResuts(ext, "foo.journal.2021.04.300");

        const resp1 = await new GoToSiblingCommand().execute({
          direction: "next",
        });
        expect(resp1).toEqual({ msg: "ok" });
        expect(
          VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith(
            "foo.journal.2021.04.bar.md"
          )
        ).toBeTruthy();

        const resp2 = await new GoToSiblingCommand().execute({
          direction: "next",
        });
        expect(resp2).toEqual({ msg: "ok" });
        expect(
          VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith(
            "foo.journal.2021.04.baz.md"
          )
        ).toBeTruthy();

        const resp3 = await new GoToSiblingCommand().execute({
          direction: "next",
        });
        expect(resp3).toEqual({ msg: "ok" });
        expect(
          VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith(
            "foo.journal.2021.04.zlob.md"
          )
        ).toBeTruthy();

        const resp4 = await new GoToSiblingCommand().execute({
          direction: "next",
        });
        expect(resp4).toEqual({ msg: "ok" });
        expect(
          VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith(
            "foo.journal.2021.04.3.md"
          )
        ).toBeTruthy();
      });

      test("no siblings", async () => {
        await beforeTestResuts(ext, "random.note.without.siblings");

        const resp = await new GoToSiblingCommand().execute({
          direction: "next",
        });
        expect(resp).toEqual({ msg: "no_siblings" });
        expect(
          getActiveDocumentFname()?.endsWith("random.note.without.siblings.md")
        ).toBeTruthy();
      });

      test("no editor", async () => {
        await VSCodeUtils.closeAllEditors();
        const resp = await new GoToSiblingCommand().execute({
          direction: "next",
        });
        expect(resp).toEqual({ msg: "no_editor" });
      });

      test("nav in root", async () => {
        await beforeTestResuts(ext, "root");

        const resp = await new GoToSiblingCommand().execute({
          direction: "next",
        });
        expect(resp).toEqual({ msg: "ok" });
        expect(getActiveDocumentFname()?.endsWith("gamma.md")).toBeTruthy();
      });
    }
  );

  describeMultiWS(
    "temp",
    {
      postSetupHook: createNotesForMultiWorkspace,
    },
    () => {
      let ext: IDendronExtension;

      before(() => {
        ext = ExtensionProvider.getExtension();
      });

      test("temp", async () => {
        const { vaults } = ext.getDWorkspace();

        for (const vault of vaults) {
          await beforeTestResuts(ext, "foo.journal.2020.08.29", vault);
          const resp = await new GoToSiblingCommand().execute({
            direction: "next",
          });
          expect(resp).toEqual({ msg: "ok" });
          expect(
            getActiveDocumentFname()?.endsWith("foo.journal.2020.08.30.md")
          ).toBeTruthy();
        }
      });
    }
  );
});

// suite("GoToSibling", function () {
//   const direction = "next" as const;
//   const ctx = setupBeforeAfter(this, {});

//   test("traversal from parent", (done) => {
//     runLegacyMultiWorkspaceTest({
//       ctx,
//       postSetupHook: async ({ wsRoot, vaults }) => {
//         const vault = vaults[0];
//         await createNotes(wsRoot, vault);
//         await note2File({
//           note: NoteUtils.create({ fname: "foo.journal.2020.08", vault }),
//           vault,
//           wsRoot,
//         });
//         await note2File({
//           note: NoteUtils.create({ fname: "foo.journal.2020.09", vault }),
//           vault,
//           wsRoot,
//         });
//       },
//       onInit: async ({ vaults, wsRoot }) => {
//         const vault = vaults[0];
//         const vpath = vault2Path({ wsRoot, vault });

//         const notePath = path.join(vpath, "foo.journal.2020.08.md");
//         await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
//         const resp = await new GoToSiblingCommand().execute({ direction });
//         await runJestHarnessV2(
//           [
//             {
//               actual: resp,
//               expected: { msg: "ok" },
//             },
//             {
//               actual:
//                 VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith(
//                   "foo.journal.2020.09.md"
//                 ),
//               expected: true,
//             },
//           ],
//           expect
//         );
//         done();
//       },
//     });
//   });

//   test("go over index", (done) => {
//     runLegacyMultiWorkspaceTest({
//       ctx,
//       postSetupHook: async ({ wsRoot, vaults }) => {
//         const vault = vaults[0];
//         await createNotes(wsRoot, vault);
//       },
//       onInit: async ({ vaults, wsRoot }) => {
//         const vault = vaults[0];
//         const vpath = vault2Path({ wsRoot, vault });

//         const notePath = path.join(vpath, "foo.journal.2020.08.31.md");
//         await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
//         const resp = await new GoToSiblingCommand().execute({ direction });
//         await runJestHarnessV2(
//           [
//             {
//               actual: resp,
//               expected: { msg: "ok" },
//             },
//             VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith(
//               "foo.journal.2020.08.29.md"
//             ),
//           ],
//           expect
//         );
//         done();
//       },
//     });
//   });

//   test("numeric siblings sort correctly", (done) => {
//     runLegacyMultiWorkspaceTest({
//       ctx,
//       postSetupHook: async ({ wsRoot, vaults }) => {
//         const vault = vaults[0];
//         await note2File({
//           note: NoteUtils.create({ fname: "foo.journal.2021.04.3", vault }),
//           vault,
//           wsRoot,
//         });
//         await note2File({
//           note: NoteUtils.create({ fname: "foo.journal.2021.04.29", vault }),
//           vault,
//           wsRoot,
//         });
//         await note2File({
//           note: NoteUtils.create({ fname: "foo.journal.2021.04.30", vault }),
//           vault,
//           wsRoot,
//         });
//       },
//       onInit: async ({ vaults, wsRoot }) => {
//         const vault = vaults[0];
//         const vpath = vault2Path({ wsRoot, vault });

//         const notePath = path.join(vpath, "foo.journal.2021.04.29.md");
//         await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
//         const resp = await new GoToSiblingCommand().execute({ direction });
//         expect(resp).toEqual({ msg: "ok" });
//         expect(
//           VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith(
//             "foo.journal.2021.04.30.md"
//           )
//         ).toBeTruthy();

//         done();
//       },
//     });
//   });

//   test("numeric and alphabetic siblings", (done) => {
//     runLegacyMultiWorkspaceTest({
//       ctx,
//       postSetupHook: async ({ wsRoot, vaults }) => {
//         const vault = vaults[0];
//         await note2File({
//           note: NoteUtils.create({ fname: "foo.journal.2021.04.3", vault }),
//           vault,
//           wsRoot,
//         });
//         await note2File({
//           note: NoteUtils.create({ fname: "foo.journal.2021.04.zlob", vault }),
//           vault,
//           wsRoot,
//         });
//         await note2File({
//           note: NoteUtils.create({ fname: "foo.journal.2021.04.29", vault }),
//           vault,
//           wsRoot,
//         });
//         await note2File({
//           note: NoteUtils.create({ fname: "foo.journal.2021.04.baz", vault }),
//           vault,
//           wsRoot,
//         });
//         await note2File({
//           note: NoteUtils.create({ fname: "foo.journal.2021.04.300", vault }),
//           vault,
//           wsRoot,
//         });
//         await note2File({
//           note: NoteUtils.create({ fname: "foo.journal.2021.04.bar", vault }),
//           vault,
//           wsRoot,
//         });
//       },
//       onInit: async ({ vaults, wsRoot }) => {
//         const vault = vaults[0];
//         const vpath = vault2Path({ wsRoot, vault });

//         const notePath = path.join(vpath, "foo.journal.2021.04.300.md");
//         await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));

//         const resp1 = await new GoToSiblingCommand().execute({ direction });
//         expect(resp1).toEqual({ msg: "ok" });
//         expect(
//           VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith(
//             "foo.journal.2021.04.bar.md"
//           )
//         ).toBeTruthy();

//         const resp2 = await new GoToSiblingCommand().execute({ direction });
//         expect(resp2).toEqual({ msg: "ok" });
//         expect(
//           VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith(
//             "foo.journal.2021.04.baz.md"
//           )
//         ).toBeTruthy();

//         const resp3 = await new GoToSiblingCommand().execute({ direction });
//         expect(resp3).toEqual({ msg: "ok" });
//         expect(
//           VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith(
//             "foo.journal.2021.04.zlob.md"
//           )
//         ).toBeTruthy();

//         const resp4 = await new GoToSiblingCommand().execute({ direction });
//         expect(resp4).toEqual({ msg: "ok" });
//         expect(
//           VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith(
//             "foo.journal.2021.04.3.md"
//           )
//         ).toBeTruthy();

//         done();
//       },
//     });
//   });

//   test("no siblings", (done) => {
//     runLegacyMultiWorkspaceTest({
//       ctx,
//       postSetupHook: async ({ wsRoot, vaults }) => {
//         const vault = vaults[0];
//         await note2File({
//           note: NoteUtils.create({ fname: "foo.journal.2020.08.29", vault }),
//           vault,
//           wsRoot,
//         });
//       },
//       onInit: async ({ vaults, wsRoot }) => {
//         const vault = vaults[0];
//         const vpath = vault2Path({ wsRoot, vault });

//         const notePath = path.join(vpath, "foo.journal.2020.08.29.md");
//         await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
//         const resp = await new GoToSiblingCommand().execute({ direction });
//         await runJestHarnessV2(
//           [
//             {
//               actual: resp,
//               expected: { msg: "no_siblings" },
//             },
//             {
//               actual:
//                 VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith(
//                   "foo.journal.2020.08.29.md"
//                 ),
//               expected: true,
//             },
//           ],
//           expect
//         );
//         done();
//       },
//     });
//   });

//   test("no open editor", (done) => {
//     runLegacyMultiWorkspaceTest({
//       ctx,
//       postSetupHook: async ({ wsRoot, vaults }) => {
//         const vault = vaults[0];
//         await note2File({
//           note: NoteUtils.create({ fname: "foo.journal.2020.08.29", vault }),
//           vault,
//           wsRoot,
//         });
//       },
//       onInit: async () => {
//         await VSCodeUtils.closeAllEditors();
//         const resp = await new GoToSiblingCommand().execute({ direction });
//         await runJestHarnessV2(
//           [
//             {
//               actual: resp,
//               expected: { msg: "no_editor" },
//             },
//           ],
//           expect
//         );
//         done();
//       },
//     });
//   });

//   test("nav in root", (done) => {
//     runLegacyMultiWorkspaceTest({
//       ctx,
//       postSetupHook: async ({ wsRoot, vaults }) => {
//         const vault = vaults[0];
//         await note2File({
//           note: NoteUtils.create({ fname: "gamma", vault }),
//           vault,
//           wsRoot,
//         });
//       },
//       onInit: async ({ vaults, wsRoot }) => {
//         const vault = vaults[0];
//         const vpath = vault2Path({ wsRoot, vault });

//         const notePath = path.join(vpath, "root.md");
//         await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
//         const resp = await new GoToSiblingCommand().execute({ direction });
//         await runJestHarnessV2(
//           [
//             {
//               actual: resp,
//               expected: { msg: "ok" },
//             },
//             {
//               actual:
//                 VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith(
//                   "gamma.md"
//                 ),
//               expected: true,
//             },
//           ],
//           expect
//         );
//         done();
//       },
//     });
//   });

//   test("nav in multi-root", (done) => {
//     runLegacyMultiWorkspaceTest({
//       ctx,
//       postSetupHook: async ({ wsRoot, vaults }) => {
//         await createNotes(wsRoot, vaults[0]);
//         await createNotes(wsRoot, vaults[1]);
//         await createNotes(wsRoot, vaults[2]);
//       },
//       onInit: async ({ vaults, wsRoot }) => {
//         await _.reduce(
//           vaults,
//           async (prev, vault) => {
//             await prev;
//             const vpath = vault2Path({ wsRoot, vault });
//             const notePath = path.join(vpath, "foo.journal.2020.08.30.md");
//             await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
//             const resp = await new GoToSiblingCommand().execute({ direction });

//             await runJestHarnessV2(
//               [
//                 {
//                   actual: resp,
//                   expected: { msg: "ok" },
//                 },
//                 {
//                   actual:
//                     VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith(
//                       path.join(
//                         `${path.basename(vault.fsPath)}`,
//                         "foo.journal.2020.08.31.md"
//                       )
//                     ),
//                   expected: true,
//                 },
//               ],
//               expect
//             );
//           },
//           Promise.resolve()
//         );
//         done();
//       },
//     });
//   });
// });
