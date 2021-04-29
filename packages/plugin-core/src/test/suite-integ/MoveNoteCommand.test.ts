import { NoteProps, NoteUtils } from "@dendronhq/common-all";
import {
  AssertUtils,
  EngineTestUtilsV4,
  ENGINE_HOOKS,
  NoteTestUtilsV4,
} from "@dendronhq/common-test-utils";
import { HistoryService } from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
import sinon from "sinon";
import * as vscode from "vscode";
import { MoveNoteCommand } from "../../commands/MoveNoteCommand";
import { LookupControllerV3 } from "../../components/lookup/LookupControllerV3";
import { VSCodeUtils } from "../../utils";
import { expect } from "../testUtilsv2";
import {
  runLegacyMultiWorkspaceTest,
  runLegacySingleWorkspaceTest,
  setupBeforeAfter,
} from "../testUtilsV3";

suite("MoveNoteCommand", function () {
  let ctx: vscode.ExtensionContext;
  ctx = setupBeforeAfter(this);

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
                vault: vaultFrom,
              },
              newLoc: {
                fname: "bar",
                vault: vaultTo,
              },
            },
          ],
        });
        expect(
          VSCodeUtils.getActiveTextEditor()?.document.fileName.endsWith(
            "vault1/bar.md"
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

  test("replace existing note", (done) => {
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
                vault: vault1,
              },
              newLoc: {
                fname: "bar",
                vault: vault2,
              },
            },
          ],
        });
        expect(
          VSCodeUtils.getActiveTextEditor()?.document.fileName.endsWith(
            "vault1/bar.md"
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
                vault: vault1,
              },
              newLoc: {
                fname: "foo",
                vault: vault2,
              },
            },
          ],
        });
        expect(
          VSCodeUtils.getActiveTextEditor()?.document.fileName.endsWith(
            "vault2/foo.md"
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
          vault: vault,
          wsRoot,
        }) as NoteProps;

        await VSCodeUtils.openNote(fooNote);
        const lc = LookupControllerV3.create();
        const provider = {} as any;
        const initialValue = path.basename(
          VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath || "",
          ".md"
        );
        lc.show({
          title: "Move note",
          placeholder: "foo",
          provider,
          initialValue,
        });
        expect(lc.quickpick!.buttons[0].pressed).toBeFalsy();

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
        const provider = {} as any;
        const initialValue = path.basename(
          VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath || "",
          ".md"
        );
        lc.show({
          title: "Move note",
          placeholder: "foo",
          provider,
          initialValue,
        });
        expect(lc.quickpick!.buttons[0].pressed).toBeTruthy();

        done();
      },
    });
  });
});
