import { expect } from "../testUtilsv2";
import { describe } from "mocha";
import { EngineNoteProvider } from "../../views/EngineNoteProvider";
import { describeMultiWS } from "../testUtilsV3";
import { MockEngineEvents } from "./MockEngineEvents";
import { NoteProps } from "@dendronhq/common-all";
import { ExtensionProvider } from "../../ExtensionProvider";
import { RenameNoteV2aCommand } from "../../commands/RenameNoteV2a";
import { vault2Path } from "@dendronhq/common-server";
import { Uri } from "vscode";
import path from "path";
import { VSCodeUtils } from "../../vsCodeUtils";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";

function getNoteUri(opts: { note: NoteProps; wsRoot: string }) {
  const { note, wsRoot } = opts;
  const { fname, vault } = note;
  const notePath = fname + ".md";
  const vaultPath = vault2Path({ vault, wsRoot });
  return Uri.file(path.join(vaultPath, notePath));
}

async function runRenameNote(opts: { noteId: string; newName: string }) {
  const engine = ExtensionProvider.getEngine();
  const { wsRoot } = engine;

  const { noteId, newName } = opts;
  const noteToRename = engine.notes[noteId];
  const noteToRenameVaultPath = vault2Path({
    wsRoot,
    vault: noteToRename.vault,
  });
  const rootUri = Uri.file(noteToRenameVaultPath);
  const oldUri = getNoteUri({ note: noteToRename, wsRoot });
  const newUri = VSCodeUtils.joinPath(rootUri, `${newName}.md`);
  const renameCmd = new RenameNoteV2aCommand();
  const renameOpts = {
    files: [
      {
        oldUri,
        newUri,
      },
    ],
    silent: true,
    closeCurrentFile: false,
    openNewFile: true,
    noModifyWatcher: true,
  };
  await renameCmd.execute(renameOpts);
}

suite("NativeTreeView tests", function () {
  this.timeout(2000);

  describe("Rename Note Command interactions", function () {
    // when renaming note with top level hierarchy
    describeMultiWS(
      "WHEN renaming note with top level hierarchy",
      {
        preSetupHook: async (opts) => {
          const { wsRoot, vaults } = opts;
          await NoteTestUtilsV4.createNote({
            wsRoot,
            vault: vaults[0],
            fname: "foo",
            genRandomId: true,
          });
        },
      },
      () => {
        test("THEN tree view correctly displays renamed note", async () => {
          const mockEvents = new MockEngineEvents();
          const provider = new EngineNoteProvider(mockEvents);

          const propsBefore = await (provider.getChildren() as Promise<
            NoteProps[]
          >);

          const vaultOneRootPropsBefore = propsBefore[0];

          const childrenBefore = await (provider.getChildren(
            vaultOneRootPropsBefore
          ) as Promise<NoteProps[]>);
          expect(childrenBefore.map((child) => child.fname)).toEqual(["foo"]);

          await runRenameNote({
            noteId: childrenBefore[0].id,
            newName: "fooz",
          });

          const childrenAfter = await (provider.getChildren(
            vaultOneRootPropsBefore
          ) as Promise<NoteProps[]>);
          expect(childrenAfter.map((child) => child.fname)).toEqual(["fooz"]);
        });
      }
    );
    // when renaming note with stub parent
    describeMultiWS(
      "WHEN renaming note with stub parent",
      {
        preSetupHook: async (opts) => {
          const { wsRoot, vaults } = opts;
          await NoteTestUtilsV4.createNote({
            wsRoot,
            vault: vaults[0],
            fname: "foo.bar",
            genRandomId: true,
          });
        },
      },
      () => {
        test("THEN tree view correctly displays renamed note", async () => {
          const mockEvents = new MockEngineEvents();
          const provider = new EngineNoteProvider(mockEvents);

          const propsBefore = await (provider.getChildren() as Promise<
            NoteProps[]
          >);

          const vaultOneRootPropsBefore = propsBefore[0];
          const vaultOneRootId = propsBefore[0].id;

          const childrenBefore = await (provider.getChildren(
            vaultOneRootPropsBefore
          ) as Promise<NoteProps[]>);
          expect(childrenBefore.map((child) => child.fname)).toEqual(["foo"]);

          const grandChildrenBefore = await (provider.getChildren(
            childrenBefore[0]
          ) as Promise<NoteProps[]>);
          expect(grandChildrenBefore.map((gchild) => gchild.fname)).toEqual([
            "foo.bar",
          ]);

          await runRenameNote({
            noteId: grandChildrenBefore[0].id,
            newName: "foo.baz",
          });

          const engine = ExtensionProvider.getEngine();
          const vault1RootPropsAfter = engine.notes[vaultOneRootId];
          const childrenAfter = await (provider.getChildren(
            vault1RootPropsAfter
          ) as Promise<NoteProps[]>);
          expect(childrenAfter.map((child) => child.fname)).toEqual(["foo"]);

          const grandChildrenAfter = await (provider.getChildren(
            childrenAfter[0]
          ) as Promise<NoteProps[]>);
          expect(grandChildrenAfter.map((gchild) => gchild.fname)).toEqual([
            "foo.baz",
          ]);
        });
      }
    );
    // when renaming note with non-stub parent
    describeMultiWS(
      "WHEN renaming note with non-stub parent",
      {
        preSetupHook: async (opts) => {
          const { wsRoot, vaults } = opts;
          await NoteTestUtilsV4.createNote({
            wsRoot,
            vault: vaults[0],
            fname: "foo",
            genRandomId: true,
          });
          await NoteTestUtilsV4.createNote({
            wsRoot,
            vault: vaults[0],
            fname: "foo.bar",
            genRandomId: true,
          });
        },
      },
      () => {
        test("THEN tree view correctly displays renamed note", async () => {
          const mockEvents = new MockEngineEvents();
          const provider = new EngineNoteProvider(mockEvents);

          const propsBefore = await (provider.getChildren() as Promise<
            NoteProps[]
          >);

          const vaultOneRootPropsBefore = propsBefore[0];
          const vaultOneRootId = propsBefore[0].id;

          const childrenBefore = await (provider.getChildren(
            vaultOneRootPropsBefore
          ) as Promise<NoteProps[]>);
          expect(childrenBefore.map((child) => child.fname)).toEqual(["foo"]);

          const grandChildrenBefore = await (provider.getChildren(
            childrenBefore[0]
          ) as Promise<NoteProps[]>);
          expect(grandChildrenBefore.map((gchild) => gchild.fname)).toEqual([
            "foo.bar",
          ]);

          await runRenameNote({
            noteId: grandChildrenBefore[0].id,
            newName: "foo.baz",
          });

          const engine = ExtensionProvider.getEngine();
          const vault1RootPropsAfter = engine.notes[vaultOneRootId];
          const childrenAfter = await (provider.getChildren(
            vault1RootPropsAfter
          ) as Promise<NoteProps[]>);
          expect(childrenAfter.map((child) => child.fname)).toEqual(["foo"]);

          const grandChildrenAfter = await (provider.getChildren(
            childrenAfter[0]
          ) as Promise<NoteProps[]>);
          expect(grandChildrenAfter.map((gchild) => gchild.fname)).toEqual([
            "foo.baz",
          ]);
        });
      }
    );
    // when renaming note stub children
    describeMultiWS(
      "WHEN renaming note with stub children",
      {
        preSetupHook: async (opts) => {
          const { wsRoot, vaults } = opts;
          await NoteTestUtilsV4.createNote({
            wsRoot,
            vault: vaults[0],
            fname: "foo",
            genRandomId: true,
          });
          await NoteTestUtilsV4.createNote({
            wsRoot,
            vault: vaults[0],
            fname: "foo.bar.egg",
            genRandomId: true,
          });
        },
      },
      () => {
        test("THEN tree view correctly displays renamed note", async () => {
          const mockEvents = new MockEngineEvents();
          const provider = new EngineNoteProvider(mockEvents);

          const propsBefore = await (provider.getChildren() as Promise<
            NoteProps[]
          >);

          const vaultOneRootPropsBefore = propsBefore[0];
          const vaultOneRootId = propsBefore[0].id;

          const childrenBefore = await (provider.getChildren(
            vaultOneRootPropsBefore
          ) as Promise<NoteProps[]>);
          expect(childrenBefore.map((child) => child.fname)).toEqual(["foo"]);

          const grandChildrenBefore = await (provider.getChildren(
            childrenBefore[0]
          ) as Promise<NoteProps[]>);
          expect(grandChildrenBefore.map((gchild) => gchild.fname)).toEqual([
            "foo.bar",
          ]);

          const greatGrandChildrenBefore = await (provider.getChildren(
            grandChildrenBefore[0]
          ) as Promise<NoteProps[]>);
          expect(
            greatGrandChildrenBefore.map((ggchild) => ggchild.fname)
          ).toEqual(["foo.bar.egg"]);

          const engine = ExtensionProvider.getEngine();
          await runRenameNote({
            noteId: childrenBefore[0].id,
            newName: "fooz",
          });

          const vault1RootPropsAfter = engine.notes[vaultOneRootId];
          const childrenAfter = await (provider.getChildren(
            vault1RootPropsAfter
          ) as Promise<NoteProps[]>);
          expect(
            childrenAfter.map((child) => {
              return { fname: child.fname, stub: child.stub };
            })
          ).toEqual([
            { fname: "foo", stub: true },
            { fname: "fooz", stub: undefined },
          ]);

          const grandChildrenAfter = await (provider.getChildren(
            childrenAfter[0]
          ) as Promise<NoteProps[]>);
          expect(grandChildrenAfter.map((gchild) => gchild.fname)).toEqual([
            "foo.bar",
          ]);

          const greatGrandChildrenAfter = await (provider.getChildren(
            grandChildrenAfter[0]
          ) as Promise<NoteProps[]>);
          expect(
            greatGrandChildrenAfter.map((ggchild) => ggchild.fname)
          ).toEqual(["foo.bar.egg"]);
        });
      }
    );
    // when renaming note with non-stub children
    // when renaming note with a chain of ancestors that are only stubs
    // when renaming note to a file name of an existing stub note
  });

  describe("filesystem change interactions", function () {});
});
