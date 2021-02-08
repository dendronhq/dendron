import { NotePropsV2, NoteUtilsV2 } from "@dendronhq/common-all";
import { EngineTestUtilsV4, ENGINE_HOOKS } from "@dendronhq/common-test-utils";
import _ from "lodash";
import * as vscode from "vscode";
import { MoveNoteCommand } from "../../commands/MoveNoteCommand";
import { VSCodeUtils } from "../../utils";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite("MoveNoteCommand", function () {
  let ctx: vscode.ExtensionContext;
  ctx = setupBeforeAfter(this);

  // test.only("move note over itself", (done) => {
  //   runLegacyMultiWorkspaceTest({
  //     ctx,
  //     preSetupHook: async ({ wsRoot, vaults }) => {
  //       ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
  //     },
  //     onInit: async ({ engine, vaults, wsRoot }) => {
  //       const notes = engine.notes;
  //       const vault1 = vaults[0];
  //       const vault2 = vaults[0];
  //       const fooNote = NoteUtilsV2.getNoteByFnameV5({
  //         fname: "foo",
  //         notes,
  //         vault: vault1,
  //         wsRoot,
  //       }) as NotePropsV2;
  //       await VSCodeUtils.openNote(fooNote);
  //       const cmd = new MoveNoteCommand();
  //       await cmd.gatherInputs();
  //     },
  //   });
  // });

  test("move note in same vault", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async ({ wsRoot, vaults }) => {
        ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
      },
      onInit: async ({ engine, vaults, wsRoot }) => {
        const notes = engine.notes;
        const vault1 = vaults[0];
        const vault2 = vaults[0];
        const fooNote = NoteUtilsV2.getNoteByFnameV5({
          fname: "foo",
          notes,
          vault: vault1,
          wsRoot,
        }) as NotePropsV2;
        await VSCodeUtils.openNote(fooNote);
        const cmd = new MoveNoteCommand();
        await cmd.execute({
          oldLoc: {
            fname: "foo",
            vault: vault1,
          },
          newLoc: {
            fname: "bar",
            vault: vault2,
          },
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
            vault: vault1,
            match: ["bar.md"],
            nomatch: ["foo.md"],
          })
        ).toBeTruthy();
        expect(
          _.isUndefined(
            NoteUtilsV2.getNoteByFnameV5({
              fname: "foo",
              notes,
              vault: vault1,
              wsRoot,
            })
          )
        ).toBeTruthy();
        expect(
          _.isUndefined(
            NoteUtilsV2.getNoteByFnameV5({
              fname: "bar",
              notes,
              vault: vault1,
              wsRoot,
            })
          )
        ).toBeFalsy();
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
        const fooNote = NoteUtilsV2.getNoteByFnameV5({
          fname: "foo",
          notes,
          vault: vault1,
          wsRoot,
        }) as NotePropsV2;
        await VSCodeUtils.openNote(fooNote);
        const cmd = new MoveNoteCommand();
        await cmd.execute({
          oldLoc: {
            fname: "foo",
            vault: vault1,
          },
          newLoc: {
            fname: "foo",
            vault: vault2,
          },
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
            NoteUtilsV2.getNoteByFnameV5({
              fname: "foo",
              notes,
              vault: vault1,
              wsRoot,
            })
          )
        ).toBeTruthy();
        expect(
          _.isUndefined(
            NoteUtilsV2.getNoteByFnameV5({
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
});
