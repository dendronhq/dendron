import { NoteProps, NoteUtils, WorkspaceOpts } from "@dendronhq/common-all";
import {
  FileTestUtils,
  NoteTestUtilsV4,
  NOTE_PRESETS_V4,
} from "@dendronhq/common-test-utils";
import { describe } from "mocha";
import path from "path";
import * as vscode from "vscode";
import { ExtensionProvider } from "../../ExtensionProvider";
import ReferenceProvider from "../../features/ReferenceProvider";
import { VSCodeUtils } from "../../vsCodeUtils";
import { WSUtils } from "../../WSUtils";
import { expect } from "../testUtilsv2";
import {
  describeMultiWS,
  runLegacyMultiWorkspaceTest,
  setupBeforeAfter,
} from "../testUtilsV3";

async function provide({
  editor,
  pos,
}: {
  editor: vscode.TextEditor;
  pos: vscode.Position;
}) {
  const doc = editor?.document as vscode.TextDocument;
  const referenceProvider = new ReferenceProvider();
  const links = await referenceProvider.provideReferences(doc, pos);
  return links;
}

async function provideForNote(editor: vscode.TextEditor) {
  return provide({ editor, pos: new vscode.Position(7, 2) });
}

async function provideForNonNote(editor: vscode.TextEditor) {
  return provide({ editor, pos: new vscode.Position(0, 2) });
}

const checkRefs = ({
  links,
  refs,
  wsRoot,
}: {
  links: vscode.Location[];
  refs: NoteProps[];
  wsRoot: string;
}) => {
  expect(links?.length).toEqual(2);
  const firstLineRange = new vscode.Range(
    new vscode.Position(7, 0),
    new vscode.Position(7, 18)
  );

  const secondLineRange = new vscode.Range(
    new vscode.Position(7, 0),
    new vscode.Position(7, 14)
  );
  expect(links!.map((l) => l.range)).toEqual([firstLineRange, secondLineRange]);
  expect(links!.map((l) => l.uri.fsPath.toLocaleLowerCase())).toEqual(
    refs.map((note) =>
      NoteUtils.getFullPath({ note, wsRoot }).toLocaleLowerCase()
    )
  );
};

const createSampleNotes = async ({ wsRoot, vaults }: WorkspaceOpts) => {
  const activeNote = await NoteTestUtilsV4.createNote({
    fname: "active",
    vault: vaults[0],
    wsRoot,
    body: "## Foo",
  });
  const refNote1 = await NoteTestUtilsV4.createNote({
    fname: "ref-one",
    vault: vaults[0],
    wsRoot,
    body: "[[Foo|active#foo]]\n\n[[Foo|active#four]]",
  });
  const refNote2 = await NoteTestUtilsV4.createNote({
    fname: "ref-two",
    vault: vaults[0],
    wsRoot,
    body: "[[active#foo]]",
  });
  return { activeNote, refNote1, refNote2 };
};

suite("GIVEN ReferenceProvider", function () {
  const ctx = setupBeforeAfter(this, {
    beforeHook: () => {},
  });

  describe("GIVEN a note with some header, and some note that references that header", () => {
    let activeNote: NoteProps;
    let refNote1: NoteProps;
    let refNote2: NoteProps;
    test("THEN reference to that header is correctly provided", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          ({ activeNote, refNote1, refNote2 } = await createSampleNotes({
            wsRoot,
            vaults,
          }));
        },
        onInit: async ({ wsRoot }) => {
          const editor = await WSUtils.openNote(activeNote);
          const links = (await provideForNote(editor)) as vscode.Location[];
          checkRefs({ links, refs: [refNote1, refNote2], wsRoot });
          done();
        },
      });
    });
  });

  describe("AND GIVEN non-dendron file", () => {
    describeMultiWS(
      "AND WHEN try to find references",
      {
        ctx,
        preSetupHook: async (opts) => {
          await FileTestUtils.createFiles(opts.wsRoot, [
            { path: "sample.with-header", body: "## Foo" },
            { path: "sample.empty", body: "" },
          ]);
          return createSampleNotes(opts);
        },
      },
      () => {
        test("THEN empty file return null", async () => {
          const { wsRoot } = ExtensionProvider.getDWorkspace();
          const notePath = path.join(wsRoot, "sample.empty");
          const editor = await VSCodeUtils.openFileInEditor(
            vscode.Uri.file(notePath)
          );
          const links = await provideForNonNote(editor!);
          expect(links).toEqual(null);
        });

        test("THEN file with header returns null", async () => {
          const { wsRoot } = ExtensionProvider.getDWorkspace();
          const notePath = path.join(wsRoot, "sample.with-header");
          const editor = await VSCodeUtils.openFileInEditor(
            vscode.Uri.file(notePath)
          );
          const links = (await provideForNonNote(editor!)) as vscode.Location[];
          expect(links).toEqual(null);
        });
      }
    );
  });

  describe("provides correct links", () => {
    test("basic", (done) => {
      let noteWithTarget1: NoteProps;
      let noteWithTarget2: NoteProps;
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          noteWithTarget1 = await NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
            fname: "alpha",
            vault: vaults[0],
            wsRoot,
          });
          noteWithTarget2 = await NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
            fname: "beta",
            vault: vaults[0],
            wsRoot,
          });
        },
        onInit: async () => {
          const editor = await WSUtils.openNote(noteWithTarget1);
          const links = await provideForNote(editor);
          expect(links!.map((l) => l.uri.fsPath)).toEqual(
            [noteWithTarget1, noteWithTarget2].map((note) =>
              NoteUtils.getFullPath({
                note,
                wsRoot: ExtensionProvider.getDWorkspace().wsRoot,
              })
            )
          );
          done();
        },
      });
    });

    test("with multiple vaults", (done) => {
      let noteWithTarget1: NoteProps;
      let noteWithTarget2: NoteProps;
      this.timeout(5000);
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          noteWithTarget1 = await NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
            fname: "alpha",
            vault: vaults[0],
            wsRoot,
          });
          noteWithTarget2 = await NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
            fname: "beta",
            vault: vaults[1],
            wsRoot,
          });
        },
        onInit: async () => {
          const editor = await WSUtils.openNote(noteWithTarget1);
          const links = await provideForNote(editor);
          expect(links!.map((l) => l.uri.fsPath)).toEqual(
            [noteWithTarget1, noteWithTarget2].map((note) =>
              NoteUtils.getFullPath({
                note,
                wsRoot: ExtensionProvider.getDWorkspace().wsRoot,
              })
            )
          );
          done();
        },
      });
    });

    test("with anchor", (done) => {
      let noteWithLink: NoteProps;

      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_TARGET.create({
            vault: vaults[0],
            wsRoot,
          });
          noteWithLink = await NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_LINK.create({
            vault: vaults[0],
            wsRoot,
          });
        },
        onInit: async () => {
          const editor = await WSUtils.openNote(noteWithLink);
          const links = await provideForNote(editor);
          expect(links!.map((l) => l.uri.fsPath)).toEqual(
            [noteWithLink].map((note) =>
              NoteUtils.getFullPath({
                note,
                wsRoot: ExtensionProvider.getDWorkspace().wsRoot,
              })
            )
          );
          done();
        },
      });
    });

    test("with alias", (done) => {
      let noteWithLink: NoteProps;

      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
            vault: vaults[0],
            wsRoot,
          });
          noteWithLink = await NOTE_PRESETS_V4.NOTE_WITH_ALIAS_LINK.create({
            vault: vaults[0],

            wsRoot,
          });
        },
        onInit: async () => {
          const editor = await WSUtils.openNote(noteWithLink);
          const links = await provideForNote(editor);
          expect(links!.map((l) => l.uri.fsPath)).toEqual(
            [noteWithLink].map((note) =>
              NoteUtils.getFullPath({
                note,
                wsRoot: ExtensionProvider.getDWorkspace().wsRoot,
              })
            )
          );
          done();
        },
      });
    });
  });
});
