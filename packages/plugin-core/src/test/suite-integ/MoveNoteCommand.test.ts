import {
  DNodeUtils,
  NoteProps,
  NoteUtils,
  VaultUtils,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import {
  AssertUtils,
  EngineTestUtilsV4,
  NoteTestUtilsV4,
  PreSetupHookFunction,
  runJestHarnessV2,
  TestPresetEntryV4,
} from "@dendronhq/common-test-utils";
import { DendronEngineV2 } from "@dendronhq/engine-server";
import {
  ENGINE_HOOKS,
  ENGINE_HOOKS_MULTI,
  ENGINE_RENAME_PRESETS,
} from "@dendronhq/engine-test-utils";
import _ from "lodash";
import path from "path";
import sinon from "sinon";
import * as vscode from "vscode";
import { MoveNoteCommand } from "../../commands/MoveNoteCommand";
import { ExtensionProvider } from "../../ExtensionProvider";
import { VSCodeUtils } from "../../vsCodeUtils";
import { WSUtils } from "../../WSUtils";
import { expect } from "../testUtilsv2";
import { createEngineFactory, describeMultiWS } from "../testUtilsV3";

const createEngine = createEngineFactory({
  renameNote: (opts: WorkspaceOpts) => {
    const rename: DendronEngineV2["renameNote"] = async ({
      oldLoc,
      newLoc,
    }) => {
      const cmd = new MoveNoteCommand();
      const vpathOld = vault2Path({
        vault: VaultUtils.getVaultByName({
          vaults: opts.vaults,
          vname: oldLoc.vaultName!,
        })!,
        wsRoot: opts.wsRoot,
      });
      await VSCodeUtils.openFileInEditor(
        vscode.Uri.file(path.join(vpathOld, oldLoc.fname + ".md"))
      );
      const resp = await cmd.execute({
        moves: [
          {
            oldLoc: {
              fname: oldLoc.fname,
              vaultName: oldLoc.vaultName,
            },
            newLoc: {
              fname: newLoc.fname,
              vaultName: newLoc.vaultName,
            },
          },
        ],
      });
      return {
        error: null,
        data: resp?.changed,
      };
    };
    return rename;
  },
});

suite("MoveNoteCommand", function () {
  _.map(
    _.omit(ENGINE_RENAME_PRESETS["NOTES"], [
      "NO_UPDATE",
      "NO_UPDATE_NUMBER_IN_FM",
      "NO_UPDATE_DOUBLE_QUOTE_IN_FM",
    ]),
    (TestCase: TestPresetEntryV4, name) => {
      const { testFunc, preSetupHook } = TestCase;

      describeMultiWS(
        name,
        {
          preSetupHook,
        },
        () => {
          test("THEN correct results", async () => {
            const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
            const engineMock = createEngine({ wsRoot, vaults });
            const results = await testFunc({
              engine: engineMock,
              vaults,
              wsRoot,
              initResp: {} as any,
            });
            await runJestHarnessV2(results, expect);
          });
        }
      );
    }
  );

  describeMultiWS(
    "WHEN update body",
    {
      postSetupHook: async ({ wsRoot, vaults }) => {
        await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
      },
    },
    () => {
      test("THEN correct results ", async () => {
        const { wsRoot, vaults, engine } = ExtensionProvider.getDWorkspace();
        const vaultDir = vault2Path({ vault: vaults[0], wsRoot });
        const vaultFrom = vaults[0];
        const vaultTo = vaults[0];

        {
          await VSCodeUtils.openFileInEditor(
            vscode.Uri.file(path.join(vaultDir, "foo.md"))
          );
          let active = VSCodeUtils.getActiveTextEditor() as vscode.TextEditor;
          await vscode.commands.executeCommand("cursorDown");
          await vscode.commands.executeCommand("cursorDown");
          await vscode.commands.executeCommand("cursorDown");
          await vscode.commands.executeCommand("cursorDown");
          await vscode.commands.executeCommand("cursorDown");
          await vscode.commands.executeCommand("cursorDown");
          await vscode.commands.executeCommand("cursorDown");
          await vscode.commands.executeCommand("cursorDown");
          await vscode.commands.executeCommand("cursorDown");
          await active.edit((builder) => {
            const pos = active.selection.active;
            builder.insert(pos, "hello");
          });
          await active.document.save();

          const cmd = new MoveNoteCommand();
          const resp = await cmd.execute({
            moves: [
              {
                oldLoc: {
                  fname: "foo",
                  vaultName: VaultUtils.getName(vaultFrom),
                },
                newLoc: {
                  fname: "foobar",
                  vaultName: VaultUtils.getName(vaultTo),
                },
              },
            ],
          });
          expect(resp?.changed?.length).toEqual(3);
          active = VSCodeUtils.getActiveTextEditor() as vscode.TextEditor;
          expect(DNodeUtils.fname(active.document.uri.fsPath)).toEqual(
            "foobar"
          );
          expect(active.document.getText().indexOf("hello") >= 0).toBeTruthy();
        }
      });
    }
  );

  let tagNote: NoteProps;
  describeMultiWS(
    "WHEN update hashtag",
    {
      postSetupHook: async ({ wsRoot, vaults }) => {
        tagNote = await NoteTestUtilsV4.createNote({
          vault: vaults[0],
          wsRoot,
          fname: "tags.test-tag.0",
        });
        await NoteTestUtilsV4.createNote({
          vault: vaults[0],
          wsRoot,
          fname: "test",
          body: "#test-tag.0",
        });
      },
    },
    () => {
      test("THEN update hashtags correctly", async () => {
        const { wsRoot, vaults, engine } = ExtensionProvider.getDWorkspace();
        await WSUtils.openNote(tagNote);

        const cmd = new MoveNoteCommand();
        await cmd.execute({
          moves: [
            {
              oldLoc: {
                fname: "tags.test-tag.0",
                vaultName: VaultUtils.getName(vaults[0]),
              },
              newLoc: {
                fname: "tags.new-0-tag.1",
                vaultName: VaultUtils.getName(vaults[0]),
              },
            },
          ],
        });
        const testNote = NoteUtils.getNoteByFnameV5({
          fname: "test",
          notes: engine.notes,
          wsRoot,
          vault: vaults[0],
        })!;
        expect(
          await AssertUtils.assertInString({
            body: testNote?.body,
            match: ["#new-0-tag.1"],
          })
        ).toBeTruthy();
      });
    }
  );

  describeMultiWS(
    "WHEN moving a note into `tags.`",
    {
      postSetupHook: async ({ wsRoot, vaults }) => {
        tagNote = await NoteTestUtilsV4.createNote({
          vault: vaults[0],
          wsRoot,
          fname: "not-really-tag",
        });
        await NoteTestUtilsV4.createNote({
          vault: vaults[0],
          wsRoot,
          fname: "test",
          body: "[[not-really-tag]]",
        });
      },
    },
    () => {
      test("THEN  turns links to hashtags", async () => {
        const { wsRoot, vaults, engine } = ExtensionProvider.getDWorkspace();
        await WSUtils.openNote(tagNote);

        const cmd = new MoveNoteCommand();
        await cmd.execute({
          moves: [
            {
              oldLoc: {
                fname: "not-really-tag",
                vaultName: VaultUtils.getName(vaults[0]),
              },
              newLoc: {
                fname: "tags.actually-tag",
                vaultName: VaultUtils.getName(vaults[0]),
              },
            },
          ],
        });
        const testNote = NoteUtils.getNoteByFnameV5({
          fname: "test",
          notes: engine.notes,
          wsRoot,
          vault: vaults[0],
        })!;
        expect(
          await AssertUtils.assertInString({
            body: testNote?.body,
            match: ["#actually-tag"],
          })
        ).toBeTruthy();
      });
    }
  );

  describeMultiWS(
    "WHEN moving a note out of `tags.`",
    {
      postSetupHook: async ({ wsRoot, vaults }) => {
        tagNote = await NoteTestUtilsV4.createNote({
          vault: vaults[0],
          wsRoot,
          fname: "tags.actually-tag",
        });
        await NoteTestUtilsV4.createNote({
          vault: vaults[0],
          wsRoot,
          fname: "test",
          body: "#actually-tag",
        });
      },
    },
    () => {
      test("THEN turns hashtags into regular links", async () => {
        const { wsRoot, vaults, engine } = ExtensionProvider.getDWorkspace();
        await WSUtils.openNote(tagNote);

        const cmd = new MoveNoteCommand();
        await cmd.execute({
          moves: [
            {
              oldLoc: {
                fname: "tags.actually-tag",
                vaultName: VaultUtils.getName(vaults[0]),
              },
              newLoc: {
                fname: "not-really-tag",
                vaultName: VaultUtils.getName(vaults[0]),
              },
            },
          ],
        });
        const testNote = NoteUtils.getNoteByFnameV5({
          fname: "test",
          notes: engine.notes,
          wsRoot,
          vault: vaults[0],
        })!;
        expect(
          await AssertUtils.assertInString({
            body: testNote?.body,
            match: ["[[not-really-tag]]"],
          })
        ).toBeTruthy();
      });
    }
  );

  describeMultiWS(
    "WHEN move note in same vault",
    {
      preSetupHook: async ({ wsRoot, vaults }) => {
        ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
      },
    },
    () => {
      test("THEN note moved correctly", async () => {
        const { wsRoot, vaults, engine } = ExtensionProvider.getDWorkspace();
        const notes = engine.notes;
        const vaultFrom = vaults[0];
        const vaultTo = vaults[0];
        const fooNote = NoteUtils.getNoteByFnameV5({
          fname: "foo",
          notes,
          vault: vaultFrom,
          wsRoot,
        }) as NoteProps;
        await WSUtils.openNote(fooNote);
        const cmd = new MoveNoteCommand();
        await cmd.execute({
          moves: [
            {
              oldLoc: {
                fname: "foo",
                vaultName: VaultUtils.getName(vaultFrom),
              },
              newLoc: {
                fname: "bar",
                vaultName: VaultUtils.getName(vaultTo),
              },
            },
          ],
        });
        expect(
          VSCodeUtils.getActiveTextEditor()?.document.fileName.endsWith(
            path.join("vault1", "bar.md")
          )
        ).toBeTruthy();
        // note not in old vault
        expect(
          await EngineTestUtilsV4.checkVault({
            wsRoot,
            vault: vaultFrom,
            match: ["bar.md"],
            nomatch: ["foo.md"],
          })
        ).toBeTruthy();
        // note note in engine
        expect(
          _.isUndefined(
            NoteUtils.getNoteByFnameV5({
              fname: "foo",
              notes,
              vault: vaultFrom,
              wsRoot,
            })
          )
        ).toBeTruthy();
        // bar isn't in the first vault
        expect(
          _.isUndefined(
            NoteUtils.getNoteByFnameV5({
              fname: "bar",
              notes,
              vault: vaultFrom,
              wsRoot,
            })
          )
        ).toBeFalsy();
      });
    }
  );

  describeMultiWS(
    "WHEN move scratch note",
    {
      preSetupHook: async ({ wsRoot, vaults }) => {
        await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
      },
    },
    () => {
      test("THEN do right thing", async () => {
        const { wsRoot, vaults, engine } = ExtensionProvider.getDWorkspace();
        const ext = ExtensionProvider.getExtension();
        const notes = engine.notes;
        const vault1 = vaults[0];
        const vault2 = vaults[0];
        const fname = "scratch.2020.02.03.0123";

        const scratchNote = await NoteTestUtilsV4.createNoteWithEngine({
          fname,
          vault: vaults[0],
          wsRoot,
          engine,
        });

        await ext.wsUtils.openNote(scratchNote);
        const cmd = new MoveNoteCommand();
        await cmd.execute({
          moves: [
            {
              oldLoc: {
                fname,
                vaultName: VaultUtils.getName(vault1),
              },
              newLoc: {
                fname: "bar",
                vaultName: VaultUtils.getName(vault2),
              },
            },
          ],
        });
        expect(
          VSCodeUtils.getActiveTextEditor()?.document.fileName.endsWith(
            path.join("vault1", "bar.md")
          )
        ).toBeTruthy();
        expect(
          await AssertUtils.assertInString({
            body: _.keys(notes).join("\n"),
            match: [fname],
          })
        ).toBeTruthy();
      });
    }
  );

  describeMultiWS(
    "WHEN move note to new vault",
    {
      preSetupHook: async ({ wsRoot, vaults }) => {
        ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
      },
    },
    () => {
      test("THEN do right thing", async () => {
        const { wsRoot, vaults, engine } = ExtensionProvider.getDWorkspace();
        const notes = engine.notes;
        const vault1 = vaults[0];
        const vault2 = vaults[1];
        const fooNote = NoteUtils.getNoteByFnameV5({
          fname: "foo",
          notes,
          vault: vault1,
          wsRoot,
        }) as NoteProps;
        await WSUtils.openNote(fooNote);
        const cmd = new MoveNoteCommand();
        await cmd.execute({
          moves: [
            {
              oldLoc: {
                fname: "foo",
                vaultName: VaultUtils.getName(vault1),
              },
              newLoc: {
                fname: "foo",
                vaultName: VaultUtils.getName(vault2),
              },
            },
          ],
        });
        expect(
          VSCodeUtils.getActiveTextEditor()?.document.fileName.endsWith(
            path.join("vault2", "foo.md")
          )
        ).toBeTruthy();

        // note not in old vault
        expect(
          await EngineTestUtilsV4.checkVault({
            wsRoot,
            vault: vault1,
            nomatch: ["foo.md"],
          })
        ).toBeTruthy();
        expect(
          await EngineTestUtilsV4.checkVault({
            wsRoot,
            vault: vault2,
            match: ["foo.md"],
          })
        ).toBeTruthy();
        expect(
          _.isUndefined(
            NoteUtils.getNoteByFnameV5({
              fname: "foo",
              notes,
              vault: vault1,
              wsRoot,
            })
          )
        ).toBeTruthy();
        expect(
          _.isUndefined(
            NoteUtils.getNoteByFnameV5({
              fname: "foo",
              notes,
              vault: vault2,
              wsRoot,
            })
          )
        ).toBeFalsy();
      });
    }
  );

  describeMultiWS(
    "WHEN bulk-move: move 2 notes from different vaults to new vault",
    {
      preSetupHook: async ({ wsRoot, vaults }) => {
        await ENGINE_HOOKS_MULTI.setupBasicMulti({ wsRoot, vaults });
      },
    },
    () => {
      test("THEN do right thing", async () => {
        const { wsRoot, vaults, engine } = ExtensionProvider.getDWorkspace();
        const notes = engine.notes;
        const vault1 = vaults[0];
        const vault2 = vaults[1];
        const vault3 = vaults[2];

        const fooNote = NoteUtils.getNoteByFnameV5({
          fname: "foo",
          notes,
          vault: vault1,
          wsRoot,
        }) as NoteProps;

        await WSUtils.openNote(fooNote);
        const cmd = new MoveNoteCommand();

        sinon
          .stub(VSCodeUtils, "showQuickPick")
          .returns(Promise.resolve("proceed") as any);
        await cmd.execute({
          moves: [
            {
              oldLoc: {
                fname: "foo",
                vaultName: VaultUtils.getName(vault1),
              },
              newLoc: {
                fname: "foo",
                vaultName: VaultUtils.getName(vault3),
              },
            },
            {
              oldLoc: {
                fname: "bar",
                vaultName: VaultUtils.getName(vault2),
              },
              newLoc: {
                fname: "bar",
                vaultName: VaultUtils.getName(vault3),
              },
            },
          ],
        });
        expect(
          VSCodeUtils.getActiveTextEditor()?.document.fileName.endsWith(
            path.join("vault3", "foo.md")
          )
        ).toBeTruthy();

        // Check that the files are not in old vaults anymore
        expect(
          await EngineTestUtilsV4.checkVault({
            wsRoot,
            vault: vault1,
            nomatch: ["foo.md"],
          })
        ).toBeTruthy();
        expect(
          await EngineTestUtilsV4.checkVault({
            wsRoot,
            vault: vault2,
            nomatch: ["bar.md"],
          })
        ).toBeTruthy();

        expect(
          _.isUndefined(
            NoteUtils.getNoteByFnameV5({
              fname: "foo",
              notes,
              vault: vault1,
              wsRoot,
            })
          )
        ).toBeTruthy();
        expect(
          _.isUndefined(
            NoteUtils.getNoteByFnameV5({
              fname: "bar",
              notes,
              vault: vault2,
              wsRoot,
            })
          )
        ).toBeTruthy();

        // Should be in vault 3
        expect(
          await EngineTestUtilsV4.checkVault({
            wsRoot,
            vault: vault3,
            match: ["foo.md", "bar.md"],
          })
        ).toBeTruthy();

        expect(
          NoteUtils.getNoteByFnameV5({
            fname: "foo",
            notes,
            vault: vault3,
            wsRoot,
          })
        ).toBeTruthy();
        expect(
          NoteUtils.getNoteByFnameV5({
            fname: "bar",
            notes,
            vault: vault3,
            wsRoot,
          })
        ).toBeTruthy();
      });
    }
  );

  describeMultiWS(
    "WHEN bulk-move: move 2 notes from same vault to new vault",
    {
      preSetupHook: async ({ wsRoot, vaults }) => {
        await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
      },
    },
    () => {
      test("THEN do right thing", async () => {
        const { wsRoot, vaults, engine } = ExtensionProvider.getDWorkspace();
        const notes = engine.notes;
        const vault1 = vaults[0];
        const vault2 = vaults[1];
        const fooNote = NoteUtils.getNoteByFnameV5({
          fname: "foo",
          notes,
          vault: vault1,
          wsRoot,
        }) as NoteProps;

        await WSUtils.openNote(fooNote);
        const cmd = new MoveNoteCommand();

        sinon
          .stub(VSCodeUtils, "showQuickPick")
          .returns(Promise.resolve("proceed") as any);

        await cmd.execute({
          moves: [
            {
              oldLoc: {
                fname: "foo",
                vaultName: VaultUtils.getName(vault1),
              },
              newLoc: {
                fname: "foo",
                vaultName: VaultUtils.getName(vault2),
              },
            },
            {
              oldLoc: {
                fname: "foo.ch1",
                vaultName: VaultUtils.getName(vault1),
              },
              newLoc: {
                fname: "foo.ch1",
                vaultName: VaultUtils.getName(vault2),
              },
            },
          ],
        });
        expect(
          VSCodeUtils.getActiveTextEditor()?.document.fileName.endsWith(
            path.join("vault2", "foo.md")
          )
        ).toBeTruthy();

        expect(
          await EngineTestUtilsV4.checkVault({
            wsRoot,
            vault: vault1,
            nomatch: ["foo.md", "foo.ch1.md"],
          })
        ).toBeTruthy();

        expect(
          _.isUndefined(
            NoteUtils.getNoteByFnameV5({
              fname: "foo",
              notes,
              vault: vault1,
              wsRoot,
            })
          )
        ).toBeTruthy();
        expect(
          _.isUndefined(
            NoteUtils.getNoteByFnameV5({
              fname: "foo.ch1",
              notes,
              vault: vault1,
              wsRoot,
            })
          )
        ).toBeTruthy();

        expect(
          await EngineTestUtilsV4.checkVault({
            wsRoot,
            vault: vault1,
            nomatch: ["foo.md", "foo.ch1.md"],
          })
        ).toBeTruthy();

        expect(
          NoteUtils.getNoteByFnameV5({
            fname: "foo",
            notes,
            vault: vault2,
            wsRoot,
          })
        ).toBeTruthy();
        expect(
          NoteUtils.getNoteByFnameV5({
            fname: "foo.ch1",
            notes,
            vault: vault2,
            wsRoot,
          })
        ).toBeTruthy();
      });
    }
  );

  const preSetupHook: PreSetupHookFunction = async ({ wsRoot, vaults }) => {
    await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
  };

  const mockProvider: any = {
    provide: () => {},
    onUpdatePickerItems: () => {},
    onDidAccept: () => {},
  };

  describeMultiWS(
    "WHEN prompt vault selection if multi vault",
    {
      preSetupHook,
      timeout: 3e6,
    },
    () => {
      test("THEN do right thing", async () => {
        const { wsRoot, vaults, engine } = ExtensionProvider.getDWorkspace();
        const notes = engine.notes;
        const vault1 = vaults[0];
        const fooNote = NoteUtils.getNoteByFnameV5({
          fname: "foo",
          notes,
          vault: vault1,
          wsRoot,
        }) as NoteProps;

        await WSUtils.openNote(fooNote);
        const lc =
          ExtensionProvider.getExtension().lookupControllerFactory.create({
            nodeType: "note",
          });
        const initialValue = path.basename(
          VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath || "",
          ".md"
        );
        await lc.show({
          title: "Move note",
          placeholder: "foo",
          provider: mockProvider,
          initialValue,
        });
        expect(lc.quickPick.buttons[0].pressed).toBeTruthy();

        lc.onHide();
      });
    }
  );
});
