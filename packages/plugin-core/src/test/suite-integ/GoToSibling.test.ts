import { DVault, WorkspaceOpts } from "@dendronhq/common-all";
import {
  CreateNoteOptsV4,
  NoteTestUtilsV4,
} from "@dendronhq/common-test-utils";
import fs from "fs";
import { describe } from "mocha";
import path from "path";
import vscode from "vscode";
import { GoToSiblingCommand } from "../../commands/GoToSiblingCommand";
import { IDendronExtension } from "../../dendronExtensionInterface";
import { ExtensionProvider } from "../../ExtensionProvider";
import { VSCodeUtils } from "../../vsCodeUtils";
import { WSUtilsV2 } from "../../WSUtilsV2";
import { expect } from "../testUtilsv2";
import { describeMultiWS, describeSingleWS } from "../testUtilsV3";

const createNotes = async ({
  opts,
  fnames,
}: {
  opts: Omit<CreateNoteOptsV4, "fname">;
  fnames: string[];
}) => {
  Promise.all(
    fnames.map(async (fname) => NoteTestUtilsV4.createNote({ ...opts, fname }))
  );
};

const getPostSetupHookForNonJournalNotes =
  (fnames: string[]) =>
  async ({ wsRoot, vaults }: WorkspaceOpts) => {
    await createNotes({
      opts: { wsRoot, vault: vaults[0] },
      fnames,
    });
  };

const getPostHostSetupHookForJournalNotes =
  (fnames: string[]) =>
  async ({ wsRoot, vaults }: WorkspaceOpts) => {
    await createNotes({
      opts: { wsRoot, vault: vaults[0], props: { traits: ["journalNote"] } },
      fnames: fnames.map((name) => "journal." + name),
    });
  };

suite("GoToSibling", () => {
  describe("WHEN non-journal note is open", async () => {
    describeSingleWS(
      "basic",
      { postSetupHook: getPostSetupHookForNonJournalNotes(["foo.a", "foo.b"]) },
      () => {
        test("Next sibling should open", async () => {
          const ext = ExtensionProvider.getExtension();
          await openNote(ext, "foo.a");

          const resp = await new GoToSiblingCommand().execute({
            direction: "next",
          });
          expect(resp).toEqual({ msg: "ok" });
          expect(getActiveDocumentFname()?.endsWith("foo.b.md")).toBeTruthy();
        });
      }
    );

    describeSingleWS(
      "go over index",
      { postSetupHook: getPostSetupHookForNonJournalNotes(["foo.a", "foo.b"]) },
      () => {
        test("Sibling navigation should wrap", async () => {
          const ext = ExtensionProvider.getExtension();
          await openNote(ext, "foo.b");

          const resp = await new GoToSiblingCommand().execute({
            direction: "next",
          });
          expect(resp).toEqual({ msg: "ok" });
          expect(getActiveDocumentFname()?.endsWith("foo.a.md")).toBeTruthy();
        });
      }
    );

    describeSingleWS(
      "numeric siblings sort correctly",
      {
        postSetupHook: getPostSetupHookForNonJournalNotes([
          "foo.1",
          "foo.2",
          "foo.3",
        ]),
      },
      () => {
        test("Sibling navigation should be in numeric order", async () => {
          const ext = ExtensionProvider.getExtension();
          await openNote(ext, "foo.1");

          const resp1 = await new GoToSiblingCommand().execute({
            direction: "next",
          });
          expect(resp1).toEqual({ msg: "ok" });
          expect(getActiveDocumentFname()?.endsWith("foo.2.md")).toBeTruthy();

          const resp2 = await new GoToSiblingCommand().execute({
            direction: "next",
          });
          expect(resp2).toEqual({ msg: "ok" });
          expect(getActiveDocumentFname()?.endsWith("foo.3.md")).toBeTruthy();
        });
      }
    );

    describeSingleWS(
      "numeric and alphabetic siblings",
      {
        postSetupHook: getPostSetupHookForNonJournalNotes([
          "foo.a",
          "foo.b",
          "foo.3",
          "foo.300",
        ]),
      },
      () => {
        test("Both alphabetical and numerical orders should be respected", async () => {
          const ext = ExtensionProvider.getExtension();
          await openNote(ext, "foo.300");

          const resp1 = await new GoToSiblingCommand().execute({
            direction: "next",
          });
          expect(resp1).toEqual({ msg: "ok" });
          expect(
            VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith(
              "foo.a.md"
            )
          ).toBeTruthy();

          const resp2 = await new GoToSiblingCommand().execute({
            direction: "next",
          });
          expect(resp2).toEqual({ msg: "ok" });
          expect(
            VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith(
              "foo.b.md"
            )
          ).toBeTruthy();

          const resp4 = await new GoToSiblingCommand().execute({
            direction: "next",
          });
          expect(resp4).toEqual({ msg: "ok" });
          expect(
            VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith(
              "foo.3.md"
            )
          ).toBeTruthy();
        });
      }
    );

    describeSingleWS(
      "no siblings",
      { postSetupHook: getPostSetupHookForNonJournalNotes(["foo"]) },
      () => {
        test("Warning message should appear", async () => {
          const ext = ExtensionProvider.getExtension();
          await openNote(ext, "foo");

          const resp = await new GoToSiblingCommand().execute({
            direction: "next",
          });
          expect(resp).toEqual({ msg: "other_error" });
          expect(getActiveDocumentFname()?.endsWith("foo.md")).toBeTruthy();
        });
      }
    );

    describeSingleWS("no editor", {}, () => {
      test("Warning message should appear", async () => {
        await VSCodeUtils.closeAllEditors();
        const resp = await new GoToSiblingCommand().execute({
          direction: "next",
        });
        expect(resp).toEqual({ msg: "no_editor" });
      });
    });

    describeSingleWS("no active dendron note", {}, () => {
      test("Warning message should appear", async () => {
        await VSCodeUtils.closeAllEditors();
        // Create a file that is not a Dendron note and show it on editor
        const workspaceRootPath = ExtensionProvider.getEngine().wsRoot;
        const filePath = path.join(workspaceRootPath, "test.txt");
        fs.writeFileSync(filePath, "sample file content", "utf8");
        const fileUri = vscode.Uri.file(filePath);
        const doc = await vscode.workspace.openTextDocument(fileUri);
        await vscode.window.showTextDocument(doc);

        const resp = await new GoToSiblingCommand().execute({
          direction: "next",
        });

        expect(resp).toEqual({ msg: "other_error" });
        expect(getActiveDocumentFname()?.endsWith("test.txt")).toBeTruthy();
      });
    });

    describeSingleWS(
      "nav in root",
      { postSetupHook: getPostSetupHookForNonJournalNotes(["foo"]) },
      () => {
        test("Sibling navigation should be performed on the children of the root note", async () => {
          const ext = ExtensionProvider.getExtension();
          await openNote(ext, "root");

          const resp = await new GoToSiblingCommand().execute({
            direction: "next",
          });
          expect(resp).toEqual({ msg: "ok" });
          expect(getActiveDocumentFname()?.endsWith("foo.md")).toBeTruthy();
        });
      }
    );

    describeMultiWS(
      "nav in multi-root",
      {
        postSetupHook: async ({ wsRoot, vaults }) => {
          Promise.all(
            vaults.map(async (vault) => {
              await NoteTestUtilsV4.createNote({
                wsRoot,
                vault,
                fname: "foo.a",
              });
              await NoteTestUtilsV4.createNote({
                wsRoot,
                vault,
                fname: "foo.b",
              });
            })
          );
        },
      },
      () => {
        test("Sibling navigation should treat notes in different vaults separately", async () => {
          const ext = ExtensionProvider.getExtension();
          await openNote(ext, "foo.a");

          const resp = await new GoToSiblingCommand().execute({
            direction: "next",
          });
          expect(resp).toEqual({ msg: "ok" });
          expect(getActiveDocumentFname()?.endsWith("foo.b.md")).toBeTruthy();
        });
      }
    );
  });

  describe("WHEN journal note is open", async () => {
    describeSingleWS(
      "WHEN next sibling is next day",
      {
        postSetupHook: getPostHostSetupHookForJournalNotes([
          "2022.07.06",
          "2022.07.07",
        ]),
      },
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
      {
        postSetupHook: getPostHostSetupHookForJournalNotes([
          "2022.06.30",
          "2022.07.01",
        ]),
      },
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
      {
        postSetupHook: getPostHostSetupHookForJournalNotes([
          "2021.12.31",
          "2022.01.01",
        ]),
      },
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
      {
        postSetupHook: getPostHostSetupHookForJournalNotes([
          "2021.07.04",
          "2023.07.05",
          "2022.07.06",
        ]),
      },
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
        postSetupHook: getPostHostSetupHookForJournalNotes([
          "06.01",
          "06.30",
          "07.01",
        ]),
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

const getActiveDocumentFname = () =>
  VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath;

const openNote = async (
  ext: IDendronExtension,
  fname: string,
  vault?: DVault
) => {
  const { engine } = ext.getDWorkspace();
  const hitNotes = await engine.findNotesMeta({ fname, vault });
  if (hitNotes.length === 0) throw Error("Cannot find the active note");
  await new WSUtilsV2(ext).openNote(hitNotes[0]);
};
