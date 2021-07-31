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
  runJestHarnessV2,
  TestPresetEntryV4,
} from "@dendronhq/common-test-utils";
import { DendronEngineV2, HistoryService } from "@dendronhq/engine-server";
import {
  ENGINE_HOOKS,
  ENGINE_RENAME_PRESETS,
} from "@dendronhq/engine-test-utils";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { MoveNoteCommand } from "../../commands/MoveNoteCommand";
import { LookupControllerV3 } from "../../components/lookup/LookupControllerV3";
import { VSCodeUtils } from "../../utils";
import { expect } from "../testUtilsv2";
import {
  createEngineFactory,
  runLegacyMultiWorkspaceTest,
  runLegacySingleWorkspaceTest,
  setupBeforeAfter,
} from "../testUtilsV3";

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
  let ctx: vscode.ExtensionContext;
  ctx = setupBeforeAfter(this);

  _.map(ENGINE_RENAME_PRESETS["NOTES"], (TestCase: TestPresetEntryV4, name) => {
    test(name, (done) => {
      const { testFunc, preSetupHook } = TestCase;

      runLegacyMultiWorkspaceTest({
        ctx,
        postSetupHook: async ({ wsRoot, vaults }) => {
          await preSetupHook({
            wsRoot,
            vaults,
          });
        },
        onInit: async ({ vaults, wsRoot }) => {
          const engineMock = createEngine({ wsRoot, vaults });
          const results = await testFunc({
            engine: engineMock,
            vaults,
            wsRoot,
            initResp: {} as any,
          });
          await runJestHarnessV2(results, expect);
          done();
        },
      });
    });
  });

  test("update body", (done) => {
    runLegacySingleWorkspaceTest({
      ctx,
      postSetupHook: async ({ wsRoot, vaults }) => {
        await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
      },
      onInit: async ({ vaults, wsRoot }) => {
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
          expect(resp?.changed?.length).toEqual(2);
          active = VSCodeUtils.getActiveTextEditor() as vscode.TextEditor;
          expect(DNodeUtils.fname(active.document.uri.fsPath)).toEqual(
            "foobar"
          );
          expect(active.document.getText().indexOf("hello") >= 0).toBeTruthy();
          done();
        }
      },
    });
  });

  test("update hashtags correctly", (done) => {
    let tagNote: NoteProps;
    runLegacySingleWorkspaceTest({
      ctx,
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
      onInit: async ({ vaults, wsRoot, engine }) => {
          await VSCodeUtils.openNote(tagNote);

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
          const testNote = NoteUtils.getNoteByFnameV5({fname: "test", notes: engine.notes, wsRoot, vault: vaults[0]})!;
          expect(await AssertUtils.assertInString({body: testNote?.body, match: ["#new-0-tag.1"]})).toBeTruthy();
          done();
      },
    });
  });

  test("moving a note into `tags.` turns links to hashtags", (done) => {
    let tagNote: NoteProps;
    runLegacySingleWorkspaceTest({
      ctx,
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
      onInit: async ({ vaults, wsRoot, engine }) => {
          await VSCodeUtils.openNote(tagNote);

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
          const testNote = NoteUtils.getNoteByFnameV5({fname: "test", notes: engine.notes, wsRoot, vault: vaults[0]})!;
          expect(await AssertUtils.assertInString({body: testNote?.body, match: ["#actually-tag"]})).toBeTruthy();
          done();
      },
    });
  });

  test("moving a note out of `tags.` turns hashtags into regular links", (done) => {
    let tagNote: NoteProps;
    runLegacySingleWorkspaceTest({
      ctx,
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
      onInit: async ({ vaults, wsRoot, engine }) => {
          await VSCodeUtils.openNote(tagNote);

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
          const testNote = NoteUtils.getNoteByFnameV5({fname: "test", notes: engine.notes, wsRoot, vault: vaults[0]})!;
          expect(await AssertUtils.assertInString({body: testNote?.body, match: ["[[not-really-tag]]"]})).toBeTruthy();
          done();
      },
    });
  });

  test("move note in same vault", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async ({ wsRoot, vaults }) => {
        ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
      },
      onInit: async ({ engine, vaults, wsRoot }) => {
        const notes = engine.notes;
        const vaultFrom = vaults[0];
        const vaultTo = vaults[0];
        const fooNote = NoteUtils.getNoteByFnameV5({
          fname: "foo",
          notes,
          vault: vaultFrom,
          wsRoot,
        }) as NoteProps;
        await VSCodeUtils.openNote(fooNote);
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
        done();
      },
    });
  });

  // TODO: this test is flaky
  test.skip("replace existing note", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async ({ wsRoot, vaults }) => {
        ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
      },
      onInit: async ({ engine, vaults, wsRoot }) => {
        const notes = engine.notes;
        const vaultFrom = vaults[0];
        const vaultTo = vaults[0];
        const fooNote = NoteUtils.getNoteByFnameV5({
          fname: "foo",
          notes,
          vault: vaultFrom,
          wsRoot,
        }) as NoteProps;
        await VSCodeUtils.openNote(fooNote);
        const cmd = new MoveNoteCommand();
        HistoryService.instance().subscribev2("lookupProvider", {
          id: "move",
          listener: async (event) => {
            expect(event.action).toEqual("error");
            done();
          },
        });
        await cmd.run({
          nonInteractive: true,
          initialValue: "bar",
          vaultName: vaultTo.fsPath,
        });
      },
    });
  });

  test("move scratch note ", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async ({ wsRoot, vaults }) => {
        await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        await NoteTestUtilsV4.createNote({
          fname: "scratch.2020.02.03.0123",
          vault: vaults[0],
          wsRoot,
        });
      },
      onInit: async ({ engine, vaults, wsRoot }) => {
        const notes = engine.notes;
        const vault1 = vaults[0];
        const vault2 = vaults[0];
        const fname = "scratch.2020.02.03.0123";
        const fooNote = NoteUtils.getNoteByFnameV5({
          fname,
          notes,
          vault: vault1,
          wsRoot,
        }) as NoteProps;
        await VSCodeUtils.openNote(fooNote);
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
        done();
      },
    });
  });

  test("move note to new vault", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async ({ wsRoot, vaults }) => {
        ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
      },
      onInit: async ({ engine, vaults, wsRoot }) => {
        const notes = engine.notes;
        const vault1 = vaults[0];
        const vault2 = vaults[1];
        const fooNote = NoteUtils.getNoteByFnameV5({
          fname: "foo",
          notes,
          vault: vault1,
          wsRoot,
        }) as NoteProps;
        await VSCodeUtils.openNote(fooNote);
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
        done();
      },
    });
  });

  const mockProvider: any = {
    provide: () => {},
    onUpdatePickerItems: () => {},
    onDidAccept: () => {},
  };

  test("don't prompt vault selection if single vault", (done) => {
    runLegacySingleWorkspaceTest({
      ctx,
      postSetupHook: async ({ wsRoot, vaults }) => {
        await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
      },
      onInit: async ({ engine, wsRoot, vaults }) => {
        const vault = vaults[0];
        const notes = engine.notes;
        const fooNote = NoteUtils.getNoteByFnameV5({
          fname: "foo",
          notes,
          vault,
          wsRoot,
        }) as NoteProps;

        await VSCodeUtils.openNote(fooNote);
        const lc = LookupControllerV3.create();
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
        expect(lc.quickpick.buttons[0].pressed).toBeFalsy();

        done();
      },
    });
  });

  test("prompt vault selection if multi vault", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async ({ wsRoot, vaults }) => {
        await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
      },
      onInit: async ({ engine, wsRoot, vaults }) => {
        const notes = engine.notes;
        const vault1 = vaults[0];
        // const vault2 = vaults[1];
        const fooNote = NoteUtils.getNoteByFnameV5({
          fname: "foo",
          notes,
          vault: vault1,
          wsRoot,
        }) as NoteProps;

        await VSCodeUtils.openNote(fooNote);
        const lc = LookupControllerV3.create();
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
        expect(lc.quickpick.buttons[0].pressed).toBeTruthy();

        done();
      },
    });
  });
});
