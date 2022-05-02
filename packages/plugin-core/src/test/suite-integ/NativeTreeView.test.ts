import { expect } from "../testUtilsv2";
import { describe, beforeEach } from "mocha";
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
import _ from "lodash";
import { DeleteNodeCommand } from "../../commands/DeleteNodeCommand";

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

async function runDeleteNote(opts: { noteId: string }) {
  const engine = ExtensionProvider.getEngine();

  const { wsRoot } = engine;
  const { noteId } = opts;
  const noteToDelete = engine.notes[noteId];
  const _fsPath = getNoteUri({ note: noteToDelete, wsRoot }).fsPath;
  const deleteCmd = new DeleteNodeCommand();
  const deleteOpts = {
    _fsPath,
    noConfirm: true,
  };
  await deleteCmd.execute(deleteOpts);
}

async function getFullTree(opts: {
  root: NoteProps;
  provider: EngineNoteProvider;
  extra?: {
    [key in keyof Partial<NoteProps>]: boolean;
  };
}): Promise<{ fname: string; childNodes: any }> {
  const { root, provider } = opts;
  const children = await (provider.getChildren(root) as Promise<NoteProps[]>);
  const childNodes = await Promise.all(
    children.map(async (child) => {
      const tree = await getFullTree({
        root: child,
        provider,
        extra: opts.extra,
      });
      return tree;
    })
  );
  const res = { fname: root.fname, childNodes };
  if (opts.extra) {
    const extraKeys = _.keys(opts.extra);
    extraKeys.forEach((key) => {
      if (opts.extra && opts.extra[key as keyof NoteProps]) {
        const value = root[key as keyof NoteProps];
        if (value !== undefined) {
          _.set(res, key, root[key as keyof NoteProps]);
        }
      }
    });
  }
  return res;
}

suite("NativeTreeView tests", function () {
  this.timeout(2000);

  describe("Rename Note Command interactions", function () {
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

    describeMultiWS(
      "WHEN renaming a note to an existing stub that has a stub parent and any children",
      {
        preSetupHook: async (opts) => {
          const { wsRoot, vaults } = opts;
          await NoteTestUtilsV4.createNote({
            wsRoot,
            vault: vaults[0],
            fname: "foo.bar.baz",
            genRandomId: true,
          });
          await NoteTestUtilsV4.createNote({
            wsRoot,
            vault: vaults[0],
            fname: "dummy",
            body: "this is some dummy content",
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

          const fullTreeBefore = await getFullTree({
            root: vaultOneRootPropsBefore,
            provider,
            extra: { stub: true },
          });

          expect(fullTreeBefore).toEqual({
            fname: "root",
            childNodes: [
              {
                fname: "dummy",
                childNodes: [],
              },
              {
                fname: "foo",
                stub: true,
                childNodes: [
                  {
                    fname: "foo.bar",
                    stub: true,
                    childNodes: [
                      {
                        fname: "foo.bar.baz",
                        childNodes: [],
                      },
                    ],
                  },
                ],
              },
            ],
          });

          await runRenameNote({
            noteId: "dummy",
            newName: "foo.bar",
          });

          const propsAfter = await (provider.getChildren() as Promise<
            NoteProps[]
          >);
          const vaultOneRootPropsAfter = propsAfter[0];
          const fullTreeAfter = await getFullTree({
            root: vaultOneRootPropsAfter,
            provider,
            extra: { stub: true },
          });

          expect(fullTreeAfter).toEqual({
            fname: "root",
            childNodes: [
              {
                fname: "foo",
                stub: true,
                childNodes: [
                  {
                    fname: "foo.bar",
                    childNodes: [
                      {
                        fname: "foo.bar.baz",
                        childNodes: [],
                      },
                    ],
                  },
                ],
              },
            ],
          });
        });
      }
    );

    describeMultiWS(
      "WHEN renaming note with stub parent and any children",
      {
        preSetupHook: async (opts) => {
          const { wsRoot, vaults } = opts;
          await NoteTestUtilsV4.createNote({
            wsRoot,
            vault: vaults[0],
            fname: "foo.bar.baz",
            genRandomId: true,
          });
          await NoteTestUtilsV4.createNote({
            wsRoot,
            vault: vaults[0],
            fname: "foo.bar",
            body: "this is some dummy content",
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

          const fullTreeBefore = await getFullTree({
            root: vaultOneRootPropsBefore,
            provider,
            extra: { stub: true },
          });

          expect(fullTreeBefore).toEqual({
            fname: "root",
            childNodes: [
              {
                fname: "foo",
                stub: true,
                childNodes: [
                  {
                    fname: "foo.bar",
                    childNodes: [
                      {
                        fname: "foo.bar.baz",
                        childNodes: [],
                      },
                    ],
                  },
                ],
              },
            ],
          });

          await runRenameNote({
            noteId: "foo.bar",
            newName: "dummy",
          });

          const propsAfter = await (provider.getChildren() as Promise<
            NoteProps[]
          >);
          const vaultOneRootPropsAfter = propsAfter[0];
          const fullTreeAfter = await getFullTree({
            root: vaultOneRootPropsAfter,
            provider,
            extra: { stub: true },
          });

          expect(fullTreeAfter).toEqual({
            fname: "root",
            childNodes: [
              {
                fname: "dummy",
                childNodes: [],
              },
              {
                fname: "foo",
                stub: true,
                childNodes: [
                  {
                    fname: "foo.bar",
                    stub: true,
                    childNodes: [
                      {
                        fname: "foo.bar.baz",
                        childNodes: [],
                      },
                    ],
                  },
                ],
              },
            ],
          });
        });
      }
    );

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

    describeMultiWS(
      "WHEN renaming note with non-stub children",
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
          await NoteTestUtilsV4.createNote({
            wsRoot,
            vault: vaults[0],
            fname: "foo.baz",
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
            "foo.baz",
          ]);

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
            "foo.baz",
          ]);
        });
      }
    );

    describeMultiWS(
      "WHEN renaming note with a chain of ancestors that are only stubs",
      {
        preSetupHook: async (opts) => {
          const { wsRoot, vaults } = opts;
          await NoteTestUtilsV4.createNote({
            wsRoot,
            vault: vaults[0],
            fname: "one.two.three.foo",
          });
        },
      },
      () => {
        test("THEN tree view correctly displays renamed note", async () => {
          const mockEvents = new MockEngineEvents();
          const provider = new EngineNoteProvider(mockEvents);

          const engine = ExtensionProvider.getEngine();

          const propsBefore = await (provider.getChildren() as Promise<
            NoteProps[]
          >);

          const vaultOneRootPropsBefore = propsBefore[0];
          const vaultOneRootId = propsBefore[0].id;
          const fullTreeBefore = await getFullTree({
            root: vaultOneRootPropsBefore,
            provider,
          });
          expect(fullTreeBefore).toEqual({
            fname: "root",
            childNodes: [
              {
                fname: "one",
                childNodes: [
                  {
                    fname: "one.two",
                    childNodes: [
                      {
                        fname: "one.two.three",
                        childNodes: [
                          {
                            fname: "one.two.three.foo",
                            childNodes: [],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          });

          await runRenameNote({
            noteId: "one.two.three.foo",
            newName: "zero",
          });

          const vaultOneRootPropsAfter = engine.notes[vaultOneRootId];
          const fullTreeAfter = await getFullTree({
            root: vaultOneRootPropsAfter,
            provider,
          });
          expect(fullTreeAfter).toEqual({
            fname: "root",
            childNodes: [
              {
                fname: "zero",
                childNodes: [],
              },
            ],
          });
        });
      }
    );

    describeMultiWS(
      "WHEN renaming note results in a chain of stub ancestors",
      {
        preSetupHook: async (opts) => {
          const { wsRoot, vaults } = opts;
          await NoteTestUtilsV4.createNote({
            wsRoot,
            vault: vaults[0],
            fname: "foo",
          });
        },
      },
      () => {
        test("THEN tree view correctly displays renamed note", async () => {
          const mockEvents = new MockEngineEvents();
          const provider = new EngineNoteProvider(mockEvents);

          const engine = ExtensionProvider.getEngine();

          const propsBefore = await (provider.getChildren() as Promise<
            NoteProps[]
          >);

          const vaultOneRootPropsBefore = propsBefore[0];
          const vaultOneRootId = propsBefore[0].id;
          const fullTreeBefore = await getFullTree({
            root: vaultOneRootPropsBefore,
            provider,
          });
          expect(fullTreeBefore).toEqual({
            fname: "root",
            childNodes: [
              {
                fname: "foo",
                childNodes: [],
              },
            ],
          });

          await runRenameNote({
            noteId: "foo",
            newName: "one.two.three.foo",
          });

          const vaultOneRootPropsAfter = engine.notes[vaultOneRootId];
          const fullTreeAfter = await getFullTree({
            root: vaultOneRootPropsAfter,
            provider,
          });
          expect(fullTreeAfter).toEqual({
            fname: "root",
            childNodes: [
              {
                fname: "one",
                childNodes: [
                  {
                    fname: "one.two",
                    childNodes: [
                      {
                        fname: "one.two.three",
                        childNodes: [
                          {
                            fname: "one.two.three.foo",
                            childNodes: [],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          });
        });
      }
    );

    describeMultiWS(
      "WHEN renaming note to replace an existing stub note",
      {
        preSetupHook: async (opts) => {
          const { wsRoot, vaults } = opts;
          await NoteTestUtilsV4.createNote({
            wsRoot,
            vault: vaults[0],
            fname: "foo",
          });
          await NoteTestUtilsV4.createNote({
            wsRoot,
            vault: vaults[0],
            fname: "one.two.three",
          });
        },
      },
      () => {
        test("THEN tree view correctly displays renamed note", async () => {
          const mockEvents = new MockEngineEvents();
          const provider = new EngineNoteProvider(mockEvents);

          const engine = ExtensionProvider.getEngine();

          const propsBefore = await (provider.getChildren() as Promise<
            NoteProps[]
          >);

          const vaultOneRootPropsBefore = propsBefore[0];
          const vaultOneRootId = propsBefore[0].id;
          const fullTreeBefore = await getFullTree({
            root: vaultOneRootPropsBefore,
            provider,
          });
          expect(fullTreeBefore).toEqual({
            fname: "root",
            childNodes: [
              {
                fname: "foo",
                childNodes: [],
              },
              {
                fname: "one",
                childNodes: [
                  {
                    fname: "one.two",
                    childNodes: [
                      {
                        fname: "one.two.three",
                        childNodes: [],
                      },
                    ],
                  },
                ],
              },
            ],
          });

          await runRenameNote({
            noteId: "foo",
            newName: "one",
          });

          const vaultOneRootPropsAfter = engine.notes[vaultOneRootId];
          const fullTreeAfter = await getFullTree({
            root: vaultOneRootPropsAfter,
            provider,
          });
          expect(fullTreeAfter).toEqual({
            fname: "root",
            childNodes: [
              {
                fname: "one",
                childNodes: [
                  {
                    fname: "one.two",
                    childNodes: [
                      {
                        fname: "one.two.three",
                        childNodes: [],
                      },
                    ],
                  },
                ],
              },
            ],
          });

          expect(engine.notes["foo"].stub).toBeFalsy();
        });
      }
    );
  });

  describe.only("Delete Note Command interactions", function () {
    describeMultiWS(
      "WHEN deleting note with top level hierarchy",
      {
        preSetupHook: async (opts) => {
          const { wsRoot, vaults } = opts;
          await NoteTestUtilsV4.createNote({
            wsRoot,
            vault: vaults[0],
            fname: "foo",
          });
        },
      },
      () => {
        test("THEN tree view correctly removes deleted note", async () => {
          const mockEvents = new MockEngineEvents();
          const provider = new EngineNoteProvider(mockEvents);

          const propsBefore = await (provider.getChildren() as Promise<
            NoteProps[]
          >);
          const vaultOneRootPropsBefore = propsBefore[0];
          const fullTreeBefore = await getFullTree({
            root: vaultOneRootPropsBefore,
            provider,
          });

          expect(fullTreeBefore).toEqual({
            fname: "root",
            childNodes: [
              {
                fname: "foo",
                childNodes: [],
              },
            ],
          });

          await runDeleteNote({ noteId: "foo" });

          const propsAfter = await (provider.getChildren() as Promise<
            NoteProps[]
          >);
          const vaultOneRootPropsAfter = propsAfter[0];
          const fullTreeAfter = await getFullTree({
            root: vaultOneRootPropsAfter,
            provider,
          });

          expect(fullTreeAfter).toEqual({
            fname: "root",
            childNodes: [],
          });
        });
      }
    );

    describeMultiWS(
      "WHEN deleting note with stub parent",
      {
        preSetupHook: async (opts) => {
          const { wsRoot, vaults } = opts;
          await NoteTestUtilsV4.createNote({
            wsRoot,
            vault: vaults[0],
            fname: "foo.bar",
          });
        },
      },
      () => {
        test("THEN tree view correctly removes deleted note and stub parent", async () => {
          const mockEvents = new MockEngineEvents();
          const provider = new EngineNoteProvider(mockEvents);

          const propsBefore = await (provider.getChildren() as Promise<
            NoteProps[]
          >);
          const vaultOneRootPropsBefore = propsBefore[0];
          const fullTreeBefore = await getFullTree({
            root: vaultOneRootPropsBefore,
            provider,
            extra: { stub: true },
          });

          expect(fullTreeBefore).toEqual({
            fname: "root",
            childNodes: [
              {
                fname: "foo",
                childNodes: [
                  {
                    fname: "foo.bar",
                    childNodes: [],
                  },
                ],
                stub: true,
              },
            ],
          });

          await runDeleteNote({ noteId: "foo.bar" });

          const propsAfter = await (provider.getChildren() as Promise<
            NoteProps[]
          >);
          const vaultOneRootPropsAfter = propsAfter[0];
          const fullTreeAfter = await getFullTree({
            root: vaultOneRootPropsAfter,
            provider,
            extra: { stub: true },
          });

          expect(fullTreeAfter).toEqual({
            fname: "root",
            childNodes: [],
          });
        });
      }
    );

    describeMultiWS(
      "WHEN deleting note with non-stub parent",
      {
        preSetupHook: async (opts) => {
          const { wsRoot, vaults } = opts;
          await NoteTestUtilsV4.createNote({
            wsRoot,
            vault: vaults[0],
            fname: "foo",
          });
          await NoteTestUtilsV4.createNote({
            wsRoot,
            vault: vaults[0],
            fname: "foo.bar",
          });
        },
      },
      () => {
        test("THEN tree view correctly removes deleted note", async () => {
          const mockEvents = new MockEngineEvents();
          const provider = new EngineNoteProvider(mockEvents);

          const propsBefore = await (provider.getChildren() as Promise<
            NoteProps[]
          >);
          const vaultOneRootPropsBefore = propsBefore[0];
          const fullTreeBefore = await getFullTree({
            root: vaultOneRootPropsBefore,
            provider,
            extra: { stub: true },
          });

          expect(fullTreeBefore).toEqual({
            fname: "root",
            childNodes: [
              {
                fname: "foo",
                childNodes: [
                  {
                    fname: "foo.bar",
                    childNodes: [],
                  },
                ],
              },
            ],
          });

          await runDeleteNote({ noteId: "foo.bar" });

          const propsAfter = await (provider.getChildren() as Promise<
            NoteProps[]
          >);
          const vaultOneRootPropsAfter = propsAfter[0];
          const fullTreeAfter = await getFullTree({
            root: vaultOneRootPropsAfter,
            provider,
            extra: { stub: true },
          });

          expect(fullTreeAfter).toEqual({
            fname: "root",
            childNodes: [
              {
                fname: "foo",
                childNodes: [],
              },
            ],
          });
        });
      }
    );

    describeMultiWS(
      "WHEN deleting note with stub children",
      {
        preSetupHook: async (opts) => {
          const { wsRoot, vaults } = opts;
          await NoteTestUtilsV4.createNote({
            wsRoot,
            vault: vaults[0],
            fname: "foo",
          });
          await NoteTestUtilsV4.createNote({
            wsRoot,
            vault: vaults[0],
            fname: "foo.bar.egg",
          });
        },
      },
      () => {
        test("THEN tree view correctly removes deleted note and replaces it with a stub", async () => {
          const mockEvents = new MockEngineEvents();
          const provider = new EngineNoteProvider(mockEvents);

          const propsBefore = await (provider.getChildren() as Promise<
            NoteProps[]
          >);
          const vaultOneRootPropsBefore = propsBefore[0];
          const fullTreeBefore = await getFullTree({
            root: vaultOneRootPropsBefore,
            provider,
            extra: { stub: true },
          });

          expect(fullTreeBefore).toEqual({
            fname: "root",
            childNodes: [
              {
                fname: "foo",
                childNodes: [
                  {
                    fname: "foo.bar",
                    childNodes: [
                      {
                        fname: "foo.bar.egg",
                        childNodes: [],
                      },
                    ],
                    stub: true,
                  },
                ],
              },
            ],
          });

          await runDeleteNote({ noteId: "foo" });

          const propsAfter = await (provider.getChildren() as Promise<
            NoteProps[]
          >);
          const vaultOneRootPropsAfter = propsAfter[0];
          const fullTreeAfter = await getFullTree({
            root: vaultOneRootPropsAfter,
            provider,
            extra: { stub: true },
          });

          expect(fullTreeAfter).toEqual({
            fname: "root",
            childNodes: [
              {
                fname: "foo",
                childNodes: [
                  {
                    fname: "foo.bar",
                    childNodes: [
                      {
                        fname: "foo.bar.egg",
                        childNodes: [],
                      },
                    ],
                    stub: true,
                  },
                ],
                stub: true,
              },
            ],
          });
        });
      }
    );

    describeMultiWS(
      "WHEN deleting note with non-stub children",
      {
        preSetupHook: async (opts) => {
          const { wsRoot, vaults } = opts;
          await NoteTestUtilsV4.createNote({
            wsRoot,
            vault: vaults[0],
            fname: "foo",
          });
          await NoteTestUtilsV4.createNote({
            wsRoot,
            vault: vaults[0],
            fname: "foo.bar",
          });
          await NoteTestUtilsV4.createNote({
            wsRoot,
            vault: vaults[0],
            fname: "foo.baz",
          });
        },
      },
      () => {
        test("THEN tree view correctly removes deleted note and replaces it with a stub", async () => {
          const mockEvents = new MockEngineEvents();
          const provider = new EngineNoteProvider(mockEvents);

          const propsBefore = await (provider.getChildren() as Promise<
            NoteProps[]
          >);
          const vaultOneRootPropsBefore = propsBefore[0];
          const fullTreeBefore = await getFullTree({
            root: vaultOneRootPropsBefore,
            provider,
            extra: { stub: true },
          });

          expect(fullTreeBefore).toEqual({
            fname: "root",
            childNodes: [
              {
                fname: "foo",
                childNodes: [
                  {
                    fname: "foo.bar",
                    childNodes: [],
                  },
                  {
                    fname: "foo.baz",
                    childNodes: [],
                  },
                ],
              },
            ],
          });

          await runDeleteNote({ noteId: "foo" });

          const propsAfter = await (provider.getChildren() as Promise<
            NoteProps[]
          >);
          const vaultOneRootPropsAfter = propsAfter[0];
          const fullTreeAfter = await getFullTree({
            root: vaultOneRootPropsAfter,
            provider,
            extra: { stub: true },
          });

          expect(fullTreeAfter).toEqual({
            fname: "root",
            childNodes: [
              {
                fname: "foo",
                childNodes: [
                  {
                    fname: "foo.bar",
                    childNodes: [],
                  },
                  {
                    fname: "foo.baz",
                    childNodes: [],
                  },
                ],
                stub: true,
              },
            ],
          });
        });
      }
    );
    describeMultiWS(
      "WHEN deleting note with chain of ancestors that are only stubs",
      {
        preSetupHook: async (opts) => {
          const { wsRoot, vaults } = opts;
          await NoteTestUtilsV4.createNote({
            wsRoot,
            vault: vaults[0],
            fname: "one.two.three.foo",
          });
        },
      },
      () => {
        test("THEN tree view correctly removes deleted note and all its ancestor stubs", async () => {
          const mockEvents = new MockEngineEvents();
          const provider = new EngineNoteProvider(mockEvents);

          const propsBefore = await (provider.getChildren() as Promise<
            NoteProps[]
          >);
          const vaultOneRootPropsBefore = propsBefore[0];
          const fullTreeBefore = await getFullTree({
            root: vaultOneRootPropsBefore,
            provider,
            extra: { stub: true },
          });

          expect(fullTreeBefore).toEqual({
            fname: "root",
            childNodes: [
              {
                fname: "one",
                childNodes: [
                  {
                    fname: "one.two",
                    childNodes: [
                      {
                        fname: "one.two.three",
                        childNodes: [
                          {
                            fname: "one.two.three.foo",
                            childNodes: [],
                          },
                        ],
                        stub: true,
                      },
                    ],
                    stub: true,
                  },
                ],
                stub: true,
              },
            ],
          });

          await runDeleteNote({ noteId: "one.two.three.foo" });

          const propsAfter = await (provider.getChildren() as Promise<
            NoteProps[]
          >);
          const vaultOneRootPropsAfter = propsAfter[0];
          const fullTreeAfter = await getFullTree({
            root: vaultOneRootPropsAfter,
            provider,
            extra: { stub: true },
          });

          expect(fullTreeAfter).toEqual({
            fname: "root",
            childNodes: [],
          });
        });
      }
    );

    describeMultiWS(
      "WHEN deleting note that was just created",
      {
        preSetupHook: async (opts) => {
          const { wsRoot, vaults } = opts;
          await NoteTestUtilsV4.createNote({
            wsRoot,
            vault: vaults[0],
            fname: "foo",
          });
        },
      },
      () => {
        describe("AND created note is top hierarchy", () => {
          test("THEN tree view correctly removes deleted note", async () => {
            const mockEvents = new MockEngineEvents();
            const provider = new EngineNoteProvider(mockEvents);
            const { wsRoot, vaults, engine } =
              ExtensionProvider.getDWorkspace();
            await NoteTestUtilsV4.createNoteWithEngine({
              wsRoot,
              vault: vaults[0],
              fname: "bar",
              engine,
            });
            const propsBefore = await (provider.getChildren() as Promise<
              NoteProps[]
            >);
            const vaultOneRootPropsBefore = propsBefore[0];
            const fullTreeBefore = await getFullTree({
              root: vaultOneRootPropsBefore,
              provider,
              extra: { stub: true },
            });

            expect(fullTreeBefore).toEqual({
              fname: "root",
              childNodes: [
                {
                  fname: "bar",
                  childNodes: [],
                },
                {
                  fname: "foo",
                  childNodes: [],
                },
              ],
            });

            await runDeleteNote({ noteId: "bar" });

            const propsAfter = await (provider.getChildren() as Promise<
              NoteProps[]
            >);
            const vaultOneRootPropsAfter = propsAfter[0];
            const fullTreeAfter = await getFullTree({
              root: vaultOneRootPropsAfter,
              provider,
            });
            expect(fullTreeAfter).toEqual({
              fname: "root",
              childNodes: [
                {
                  fname: "foo",
                  childNodes: [],
                },
              ],
            });
          });
        });

        describe("AND created note also creates stub parent", () => {
          test("THEN tree view correctly removes deleted note and stub parent", async () => {
            const mockEvents = new MockEngineEvents();
            const provider = new EngineNoteProvider(mockEvents);
            const { wsRoot, vaults, engine } =
              ExtensionProvider.getDWorkspace();
            await NoteTestUtilsV4.createNoteWithEngine({
              wsRoot,
              vault: vaults[0],
              fname: "bar.egg",
              engine,
            });
            const propsBefore = await (provider.getChildren() as Promise<
              NoteProps[]
            >);
            const vaultOneRootPropsBefore = propsBefore[0];
            const fullTreeBefore = await getFullTree({
              root: vaultOneRootPropsBefore,
              provider,
              extra: { stub: true },
            });

            expect(fullTreeBefore).toEqual({
              fname: "root",
              childNodes: [
                {
                  fname: "bar",
                  childNodes: [
                    {
                      fname: "bar.egg",
                      childNodes: [],
                    },
                  ],
                  stub: true,
                },
                {
                  fname: "foo",
                  childNodes: [],
                },
              ],
            });

            await runDeleteNote({ noteId: "bar.egg" });

            const propsAfter = await (provider.getChildren() as Promise<
              NoteProps[]
            >);
            const vaultOneRootPropsAfter = propsAfter[0];
            const fullTreeAfter = await getFullTree({
              root: vaultOneRootPropsAfter,
              provider,
              extra: { stub: true },
            });
            expect(fullTreeAfter).toEqual({
              fname: "root",
              childNodes: [
                {
                  fname: "foo",
                  childNodes: [],
                },
              ],
            });
          });
        });

        describe("AND created note has stub children", () => {
          test("THEN tree view correctly removes deleted note and replaces it with a stub", async () => {
            const mockEvents = new MockEngineEvents();
            const provider = new EngineNoteProvider(mockEvents);
            const { wsRoot, vaults, engine } =
              ExtensionProvider.getDWorkspace();
            await NoteTestUtilsV4.createNoteWithEngine({
              wsRoot,
              vault: vaults[0],
              fname: "one.two.three",
              engine,
            });

            await NoteTestUtilsV4.createNoteWithEngine({
              wsRoot,
              vault: vaults[0],
              fname: "one.two",
              engine,
            });
            const propsBefore = await (provider.getChildren() as Promise<
              NoteProps[]
            >);
            const vaultOneRootPropsBefore = propsBefore[0];
            const fullTreeBefore = await getFullTree({
              root: vaultOneRootPropsBefore,
              provider,
              extra: { stub: true },
            });

            expect(fullTreeBefore).toEqual({
              fname: "root",
              childNodes: [
                {
                  fname: "foo",
                  childNodes: [],
                },
                {
                  fname: "one",
                  childNodes: [
                    {
                      fname: "one.two",
                      childNodes: [
                        {
                          fname: "one.two.three",
                          childNodes: [],
                        },
                      ],
                    },
                  ],
                  stub: true,
                },
              ],
            });

            await runDeleteNote({ noteId: "one.two" });

            const propsAfter = await (provider.getChildren() as Promise<
              NoteProps[]
            >);
            const vaultOneRootPropsAfter = propsAfter[0];
            const fullTreeAfter = await getFullTree({
              root: vaultOneRootPropsAfter,
              provider,
              extra: { stub: true },
            });
            expect(fullTreeAfter).toEqual({
              fname: "root",
              childNodes: [
                {
                  fname: "foo",
                  childNodes: [],
                },
                {
                  fname: "one",
                  childNodes: [
                    {
                      fname: "one.two",
                      childNodes: [
                        {
                          fname: "one.two.three",
                          childNodes: [],
                        },
                      ],
                      stub: true,
                    },
                  ],
                  stub: true,
                },
              ],
            });
          });
        });
      }
    );
    describeMultiWS("WHEN deleting note that was just renamed", {}, () => {
      beforeEach(async () => {
        const { vaults, wsRoot, engine } = ExtensionProvider.getDWorkspace();
        await NoteTestUtilsV4.createNoteWithEngine({
          wsRoot,
          vault: vaults[0],
          fname: "foo",
          engine,
        });
      });
      describe("AND renamed note is top hierarchy", () => {
        test("THEN tree view correctly removes note that was just renamed and deleted", async () => {
          const mockEvents = new MockEngineEvents();
          const provider = new EngineNoteProvider(mockEvents);

          await runRenameNote({
            noteId: "foo",
            newName: "bar",
          });

          const propsBefore = await (provider.getChildren() as Promise<
            NoteProps[]
          >);
          const vaultOneRootPropsBefore = propsBefore[0];
          const fullTreeBefore = await getFullTree({
            root: vaultOneRootPropsBefore,
            provider,
            extra: { stub: true },
          });

          expect(fullTreeBefore).toEqual({
            fname: "root",
            childNodes: [
              {
                fname: "bar",
                childNodes: [],
              },
            ],
          });

          await runDeleteNote({
            noteId: "foo",
          });

          const propsAfter = await (provider.getChildren() as Promise<
            NoteProps[]
          >);
          const vaultOneRootPropsAfter = propsAfter[0];
          const fullTreeAfter = await getFullTree({
            root: vaultOneRootPropsAfter,
            provider,
            extra: { stub: true },
          });

          expect(fullTreeAfter).toEqual({
            fname: "root",
            childNodes: [],
          });
        });
      });

      describe("AND renamed note created a stub parent", () => {
        test("THEN tree view correctly removes note that was just renamed and deleted as well as the stub parent", async () => {
          const mockEvents = new MockEngineEvents();
          const provider = new EngineNoteProvider(mockEvents);

          await runRenameNote({
            noteId: "foo",
            newName: "one.two.three.foo",
          });

          const propsBefore = await (provider.getChildren() as Promise<
            NoteProps[]
          >);
          const vaultOneRootPropsBefore = propsBefore[0];
          const fullTreeBefore = await getFullTree({
            root: vaultOneRootPropsBefore,
            provider,
            extra: { stub: true },
          });

          expect(fullTreeBefore).toEqual({
            fname: "root",
            childNodes: [
              {
                fname: "one",
                childNodes: [
                  {
                    fname: "one.two",
                    childNodes: [
                      {
                        fname: "one.two.three",
                        childNodes: [
                          {
                            fname: "one.two.three.foo",
                            childNodes: [],
                          },
                        ],
                        stub: true,
                      },
                    ],
                    stub: true,
                  },
                ],
                stub: true,
              },
            ],
          });

          await runDeleteNote({
            noteId: "foo",
          });

          const propsAfter = await (provider.getChildren() as Promise<
            NoteProps[]
          >);
          const vaultOneRootPropsAfter = propsAfter[0];
          const fullTreeAfter = await getFullTree({
            root: vaultOneRootPropsAfter,
            provider,
            extra: { stub: true },
          });

          expect(fullTreeAfter).toEqual({
            fname: "root",
            childNodes: [],
          });
        });
      });

      describe("AND renamed note has any children", () => {
        test("THEN THEN tree view correctly removes note that was just renamed and deleted and replaces it with a stub", async () => {
          const mockEvents = new MockEngineEvents();
          const provider = new EngineNoteProvider(mockEvents);

          const { vaults, wsRoot, engine } = ExtensionProvider.getDWorkspace();
          await NoteTestUtilsV4.createNoteWithEngine({
            wsRoot,
            vault: vaults[0],
            fname: "one.two.three.foo",
            engine,
          });

          await runRenameNote({
            noteId: "foo",
            newName: "one.two.three",
          });

          const propsBefore = await (provider.getChildren() as Promise<
            NoteProps[]
          >);
          const vaultOneRootPropsBefore = propsBefore[0];
          const fullTreeBefore = await getFullTree({
            root: vaultOneRootPropsBefore,
            provider,
            extra: { stub: true },
          });

          expect(fullTreeBefore).toEqual({
            fname: "root",
            childNodes: [
              {
                fname: "one",
                childNodes: [
                  {
                    fname: "one.two",
                    childNodes: [
                      {
                        fname: "one.two.three",
                        childNodes: [
                          {
                            fname: "one.two.three.foo",
                            childNodes: [],
                          },
                        ],
                      },
                    ],
                    stub: true,
                  },
                ],
                stub: true,
              },
            ],
          });

          await runDeleteNote({ noteId: "foo" });

          const propsAfter = await (provider.getChildren() as Promise<
            NoteProps[]
          >);
          const vaultOneRootPropsAfter = propsAfter[0];
          const fullTreeAfter = await getFullTree({
            root: vaultOneRootPropsAfter,
            provider,
            extra: { stub: true },
          });

          expect(fullTreeAfter).toEqual({
            fname: "root",
            childNodes: [
              {
                fname: "one",
                childNodes: [
                  {
                    fname: "one.two",
                    childNodes: [
                      {
                        fname: "one.two.three",
                        childNodes: [
                          {
                            fname: "one.two.three.foo",
                            childNodes: [],
                          },
                        ],
                        stub: true,
                      },
                    ],
                    stub: true,
                  },
                ],
                stub: true,
              },
            ],
          });
        });
      });
    });
  });
  describe("filesystem change interactions", function () {});
});
