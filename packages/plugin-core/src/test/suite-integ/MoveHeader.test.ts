import { DVault, NoteProps } from "@dendronhq/common-all";
import {
  NoteTestUtilsV4,
  PreSetupHookFunction,
} from "@dendronhq/common-test-utils";
import { VSCodeUtils } from "../../utils";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";
import { describe, beforeEach } from "mocha";
import vscode from "vscode";
import { expect } from "../testUtilsv2";
import { MoveHeaderCommand } from "../../commands/MoveHeader";
import _ from "lodash";

suite("MoveHeader", function () {
  const ctx = setupBeforeAfter(this);

  describe("GIVEN a note with a simple header", () => {
    let originNote: NoteProps;
    let destNote: NoteProps;
    let preSetupHook: PreSetupHookFunction;

    beforeEach(() => {
      preSetupHook = async ({
        wsRoot,
        vaults,
      }: {
        wsRoot: string;
        vaults: DVault[];
      }) => {
        originNote = await NoteTestUtilsV4.createNote({
          fname: "origin",
          wsRoot,
          vault: vaults[0],
          body: "## Foo header\n\n",
        });
        destNote = await NoteTestUtilsV4.createNote({
          fname: "dest",
          wsRoot,
          vault: vaults[0],
          body: "# Some header",
        });
        await NoteTestUtilsV4.createNote({
          fname: "ref-note",
          wsRoot,
          vault: vaults[0],
          body: "[[Origin|origin]]\n\n[[Foo|origin#foo-header]]",
        });
      };
    });

    describe("WHEN header is selected", () => {
      let onInitFunc: Function;
      beforeEach(() => {
        onInitFunc = (nextFunc: Function) => {
          return async () => {
            const editor = await VSCodeUtils.openNote(originNote);
            editor.selection = new vscode.Selection(7, 0, 7, 0);
            nextFunc();
          };
        };
      });

      describe("AND WHEN note reference exists in destination", () => {
        test("THEN selected header is moved from origin to dest", (done) => {
          runLegacyMultiWorkspaceTest({
            ctx,
            preSetupHook: async ({
              wsRoot,
              vaults,
            }: {
              wsRoot: string;
              vaults: DVault[];
            }) => {
              originNote = await NoteTestUtilsV4.createNote({
                fname: "origin",
                wsRoot,
                vault: vaults[0],
                body: "## Foo header\n\n",
              });
              destNote = await NoteTestUtilsV4.createNote({
                fname: "dest",
                wsRoot,
                vault: vaults[0],
                body: "![[ref-note]] ",
              });
              await NoteTestUtilsV4.createNote({
                fname: "ref-note",
                wsRoot,
                vault: vaults[0],
                body: "[[Foo|origin#foo-header]]",
              });
            },
            onInit: onInitFunc(async () => {
              const cmd = new MoveHeaderCommand();
              const out = await cmd.run({ dest: destNote });
              expect(out!.origin.body.includes("## Foo header")).toBeFalsy();
              expect(out!.dest!.body.includes("## Foo header")).toBeTruthy();
              done();
            }),
          });
        });
      });

      test("THEN selected header is moved from origin to dest", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook,
          onInit: onInitFunc(async () => {
            const cmd = new MoveHeaderCommand();
            const out = await cmd.run({ dest: destNote });
            expect(out!.origin.body.includes("## Foo header")).toBeFalsy();
            expect(out!.dest!.body.includes("## Foo header")).toBeTruthy();
            done();
          }),
        });
      });

      test("THEN only reference to moved header is updated", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook,
          onInit: onInitFunc(async () => {
            const cmd = new MoveHeaderCommand();
            const out = await cmd.run({ dest: destNote });
            await new Promise((res) => setTimeout(res, 100));
            expect(
              out!.updated[0].body.includes("[[Foo|dest#foo-header]]")
            ).toBeTruthy();
            expect(
              out!.updated[0].body.includes("[[Origin|dest]]")
            ).toBeFalsy();
            done();
          }),
        });
      });
    });

    describe("WHEN header is not select", () => {
      const onInitFunc = (nextFunc: Function) => {
        return async () => {
          const editor = await VSCodeUtils.openNote(originNote);
          editor.selection = new vscode.Selection(8, 0, 8, 0);
          nextFunc();
        };
      };
      test("THEN MoveHeaderCommand throws an error", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook,
          onInit: onInitFunc(async () => {
            const cmd = new MoveHeaderCommand();
            let out;
            try {
              out = await cmd.gatherInputs({ dest: destNote });
            } catch (error) {
              expect(error).toContain(
                "You must first select the header you want to move."
              );
            }
            expect(_.isUndefined(out)).toBeTruthy();
            done();
          }),
        });
      });
    });

    describe("WHEN no note is open", () => {
      const onInitFunc = (nextFunc: Function) => {
        return async () => {
          await VSCodeUtils.closeAllEditors();
          nextFunc();
        };
      };
      test("THEN MoveHeaderCommand throws an error", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook,
          onInit: onInitFunc(async () => {
            const cmd = new MoveHeaderCommand();
            let out;
            try {
              out = await cmd.gatherInputs({});
            } catch (error) {
              expect(error).toContain("no note open.");
            }
            expect(_.isUndefined(out)).toBeTruthy();
            done();
          }),
        });
      });
    });
  });
});
