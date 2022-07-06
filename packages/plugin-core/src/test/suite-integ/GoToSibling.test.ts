import {
  DVault,
  LegacyJournalConfig,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import {
  CreateNoteOptsV4,
  NoteTestUtilsV4,
} from "@dendronhq/common-test-utils";
import { before, describe } from "mocha";
import { GoToSiblingCommand } from "../../commands/GoToSiblingCommand";
import { IDendronExtension } from "../../dendronExtensionInterface";
import { ExtensionProvider } from "../../ExtensionProvider";
import { VSCodeUtils } from "../../vsCodeUtils";
import { WSUtilsV2 } from "../../WSUtilsV2";
import { expect } from "../testUtilsv2";
import { describeSingleWS } from "../testUtilsV3";

const getActiveDocumentFname = () =>
  VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath;

const createNoteForVault = async (wsRoot: string, vault: DVault) => {
  await NoteTestUtilsV4.createNote({
    fname: "foo.journal.2020.08",
    wsRoot,
    vault,
  });

  await NoteTestUtilsV4.createNote({
    fname: "foo.journal.2020.09",
    wsRoot,
    vault,
  });

  await NoteTestUtilsV4.createNote({
    fname: "foo.journal.2020.08.29",
    wsRoot,
    vault,
  });

  await NoteTestUtilsV4.createNote({
    fname: "foo.journal.2020.08.30",
    wsRoot,
    vault,
  });

  await NoteTestUtilsV4.createNote({
    fname: "foo.journal.2020.08.31",
    wsRoot,
    vault,
  });

  await NoteTestUtilsV4.createNote({
    fname: "foo.journal.2020.09.01",
    wsRoot,
    vault,
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

// const createNotesForMultiWorkspace = async ({
//   wsRoot,
//   vaults,
// }: WorkspaceOpts) => {
//   for (const vault of vaults) {
//     await NoteTestUtilsV4.createNote({
//       fname: "foo.journal.2020.08.29",
//       wsRoot,
//       vault,
//     });

//     await NoteTestUtilsV4.createNote({
//       fname: "foo.journal.2020.08.30",
//       wsRoot,
//       vault,
//     });
//   }
// };

/* journal note
  2022.07.06 <-> 2022.07.07 (basic)
  2022.06.30 <-> 2022.07.01 (month)
  2021.12.31 <-> 2022.01.01 (year)
  2021.07.04 <-> (2023.07.05) <-> 2022.07.06 (non consecutive days)

  config is not default
  06.01 06.30 -> (07.01) default wrap behavior
*/

const openNote = async (
  ext: IDendronExtension,
  fname: string,
  vault?: DVault
) => {
  const { engine } = ext.getDWorkspace();
  const hitNotes = await engine.findNotes({ fname, vault });
  if (hitNotes.length === 0) throw Error("Cannot find the active note");
  await new WSUtilsV2(ext).openNote(hitNotes[0]);
};

const createNotes = async ({
  opts,
  fnames,
}: {
  opts: Omit<CreateNoteOptsV4, "fname">;
  fnames: string[];
}) => {
  for (const fname of fnames)
    await NoteTestUtilsV4.createNote({ ...opts, fname });
};

const getPostHostSetupHookForJournalNotes =
  (fnames: string[]) =>
  async ({ wsRoot, vaults }: WorkspaceOpts) => {
    await createNotes({
      opts: { wsRoot, vault: vaults[0], props: { traits: ["journalNote"] } },
      fnames: fnames.map((name) => "journal" + "." + name),
    });
  };

const basic = getPostHostSetupHookForJournalNotes(["2022.07.06", "2022.07.07"]);
const month = getPostHostSetupHookForJournalNotes(["2022.06.30", "2022.07.01"]);
const year = getPostHostSetupHookForJournalNotes(["2021.12.31", "2022.01.01"]);
const nonSequence = getPostHostSetupHookForJournalNotes([
  "2021.07.04",
  "2023.07.05",
  "2022.07.06",
]);
const notDefaultConfig = getPostHostSetupHookForJournalNotes([
  "06.01",
  "06.30",
  "07.01",
]);

suite("GoToSibling", () => {
  describe("WHEN non-journal note is open", async () => {
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
          await openNote(ext, "foo.journal.2020.08.29");
          const resp = await new GoToSiblingCommand().execute({
            direction: "next",
          });
          expect(resp).toEqual({ msg: "ok" });
          expect(
            getActiveDocumentFname()?.endsWith("foo.journal.2020.08.30.md")
          ).toBeTruthy();
        });

        test("traversal from parent", async () => {
          await openNote(ext, "foo.journal.2020.08");
          const resp = await new GoToSiblingCommand().execute({
            direction: "next",
          });
          expect(resp).toEqual({ msg: "ok" });
          expect(
            getActiveDocumentFname()?.endsWith("foo.journal.2020.09.md")
          ).toBeTruthy();
        });

        test("go over index", async () => {
          await openNote(ext, "foo.journal.2020.08.31");
          const resp = await new GoToSiblingCommand().execute({
            direction: "next",
          });
          expect(resp).toEqual({ msg: "ok" });
          expect(
            getActiveDocumentFname()?.endsWith("foo.journal.2020.08.29.md")
          ).toBeTruthy();
        });

        test("numeric siblings sort correctly", async () => {
          await openNote(ext, "foo.journal.2020.08.29");
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
          await openNote(ext, "foo.journal.2021.04.300");

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
          await openNote(ext, "random.note.without.siblings");

          const resp = await new GoToSiblingCommand().execute({
            direction: "next",
          });
          expect(resp).toEqual({ msg: "no_siblings" });
          expect(
            getActiveDocumentFname()?.endsWith(
              "random.note.without.siblings.md"
            )
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
          await openNote(ext, "root");

          const resp = await new GoToSiblingCommand().execute({
            direction: "next",
          });
          expect(resp).toEqual({ msg: "ok" });
          expect(getActiveDocumentFname()?.endsWith("gamma.md")).toBeTruthy();
        });
      }
    );

    // describeMultiWS(
    //   "multi-root",
    //   {
    //     postSetupHook: createNotesForMultiWorkspace,
    //   },
    //   () => {
    //     let ext: IDendronExtension;

    //     before(() => {
    //       ext = ExtensionProvider.getExtension();
    //     });

    //     test("nav in multi-root", async () => {
    //       const { vaults } = ext.getDWorkspace();

    //       for (const vault of vaults) {
    //         await beforeTestResuts(ext, "foo.journal.2020.08.29", vault);
    //         const resp = await new GoToSiblingCommand().execute({
    //           direction: "next",
    //         });
    //         expect(resp).toEqual({ msg: "ok" });
    //         expect(
    //           getActiveDocumentFname()?.endsWith("foo.journal.2020.08.30.md")
    //         ).toBeTruthy();
    //       }
    //     });
    //   }
    // );
  });

  describe("WHEN journal note is open", async () => {
    describeSingleWS(
      "WHEN next sibling is next day",
      { postSetupHook: basic },
      () => {
        test("THEN the note for the next day should open", async () => {
          const ext = ExtensionProvider.getExtension();
          await openNote(ext, "journal.2022.07.06");
          const resp = await new GoToSiblingCommand().execute({
            direction: "next",
          });
          expect(resp).toEqual({ msg: "ok" });
          expect(
            getActiveDocumentFname()?.endsWith("journal.2022.07.07.md")
          ).toBeTruthy();
        });
      }
    );

    describeSingleWS(
      "WHEN next sibling is the first day of the next month",
      { postSetupHook: month },
      () => {
        test("THEN the note for the first day of the next month should open", async () => {
          const ext = ExtensionProvider.getExtension();
          await openNote(ext, "journal.2022.06.30");
          const resp = await new GoToSiblingCommand().execute({
            direction: "next",
          });
          expect(resp).toEqual({ msg: "ok" });
          expect(
            getActiveDocumentFname()?.endsWith("journal.2022.07.01.md")
          ).toBeTruthy();
        });
      }
    );

    describeSingleWS(
      "WHEN next sibling is the first day of the next year",
      { postSetupHook: year },
      () => {
        test("THEN the note for the first day of the next year should open", async () => {
          const ext = ExtensionProvider.getExtension();
          await openNote(ext, "journal.2021.12.31");
          const resp = await new GoToSiblingCommand().execute({
            direction: "next",
          });
          expect(resp).toEqual({ msg: "ok" });
          expect(
            getActiveDocumentFname()?.endsWith("journal.2022.01.01.md")
          ).toBeTruthy();
        });
      }
    );

    describeSingleWS(
      "WHEN next sibling is not the next day in sequence",
      { postSetupHook: nonSequence },
      () => {
        test("THEN the note for the closest day should open", async () => {
          const ext = ExtensionProvider.getExtension();
          await openNote(ext, "journal.2021.07.04");
          const resp = await new GoToSiblingCommand().execute({
            direction: "next",
          });
          expect(resp).toEqual({ msg: "ok" });
          expect(
            getActiveDocumentFname()?.endsWith("journal.2022.07.06.md")
          ).toBeTruthy();
        });
      }
    );

    describeSingleWS(
      "WHEN date config for journal notes is note default",
      {
        postSetupHook: notDefaultConfig,
        modConfigCb: (config) => {
          // Change journal date config on dendron.yml for the current workspace
          config.workspace.journal.dateFormat = "MM.dd";
          return config;
        },
      },
      () => {
        test("THEN the default non-chronological one-parent-level navigation should be used", async () => {
          const ext = ExtensionProvider.getExtension();
          await openNote(ext, "journal.06.30");
          const resp = await new GoToSiblingCommand().execute({
            direction: "next",
          });
          expect(resp).toEqual({ msg: "ok" });
          expect(
            getActiveDocumentFname()?.endsWith("journal.06.01.md")
          ).toBeTruthy();
        });
      }
    );
  });
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
