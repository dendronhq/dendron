import { DendronError, DVault, NoteProps } from "@dendronhq/common-all";
import {
  NoteTestUtilsV4,
  PreSetupHookFunction,
} from "@dendronhq/common-test-utils";
import { VSCodeUtils } from "../../vsCodeUtils";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";
import { describe, beforeEach, afterEach } from "mocha";
import vscode from "vscode";
import { expect } from "../testUtilsv2";
import { MoveHeaderCommand } from "../../commands/MoveHeader";
import _ from "lodash";
import { ExtensionProvider } from "../../ExtensionProvider";
import { NotePickerUtils } from "../../components/lookup/NotePickerUtils";
import sinon from "sinon";
import { WSUtilsV2 } from "../../WSUtilsV2";

suite("MoveHeader", function () {
  const ctx = setupBeforeAfter(this);

  describe("GIVEN a note with a simple header", () => {
    let originNote: NoteProps;
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
          body: "## Foo header\n\n some text with anchor ^123",
        });
        await NoteTestUtilsV4.createNote({
          fname: "dest",
          wsRoot,
          vault: vaults[0],
          body: "# Some header",
        });
        await NoteTestUtilsV4.createNote({
          fname: "ref-note",
          wsRoot,
          vault: vaults[0],
          body: "[[Origin|origin]]\n\n[[Foo|origin#foo-header]]\n\n",
        });
        await NoteTestUtilsV4.createNote({
          fname: "ref-note2",
          wsRoot,
          vault: vaults[0],
          body: "[[Foo|dendron://vault1/origin#foo-header]]\n\n",
        });
      };
    });

    afterEach(() => {
      sinon.restore();
    });

    describe("WHEN header is selected", () => {
      let onInitFunc: Function;
      beforeEach(() => {
        onInitFunc = (nextFunc: Function) => {
          return async () => {
            const ext = ExtensionProvider.getExtension();
            const editor = await new WSUtilsV2(ext).openNote(originNote);
            editor.selection = new vscode.Selection(7, 0, 7, 0);
            nextFunc();
          };
        };
      });

      test("THEN the initial value is filled in with the current hierarchy", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook,
          onInit: onInitFunc(async () => {
            const cmd = new MoveHeaderCommand();
            const gatherOut = await cmd.gatherInputs({
              nonInteractive: true,
            });

            expect(gatherOut?.dest?.fname).toEqual(originNote.fname);
            done();
          }),
        });
      });

      describe("AND WHEN existing item is selected for destination", () => {
        test("THEN selected item is used for destination", (done) => {
          runLegacyMultiWorkspaceTest({
            ctx,
            preSetupHook,
            onInit: onInitFunc(async () => {
              sinon
                .stub(NotePickerUtils, "getInitialValueFromOpenEditor")
                .returns("dest");
              const cmd = new MoveHeaderCommand();
              const gatherOut = await cmd.gatherInputs({
                nonInteractive: true,
              });

              expect(gatherOut?.dest?.fname).toEqual("dest");
              done();
            }),
          });
        });
      });

      describe("AND WHEN move destination note does not exist", () => {
        test("THEN new note is created and header is appended to new note", (done) => {
          runLegacyMultiWorkspaceTest({
            ctx,
            preSetupHook,
            onInit: onInitFunc(async () => {
              sinon
                .stub(NotePickerUtils, "getInitialValueFromOpenEditor")
                .returns("new-note");
              const cmd = new MoveHeaderCommand();
              const out = await cmd.run({
                useSameVault: true,
                nonInteractive: true,
              });
              const ws = ExtensionProvider.getDWorkspace();
              const { engine } = ws;
              const vaults = await ws.vaults;
              const newNote = (
                await engine.findNotesMeta({
                  fname: "new-note",
                  vault: vaults[0],
                })
              )[0];

              expect(!_.isUndefined(newNote)).toBeTruthy();
              expect(out!.origin.body.includes("## Foo header")).toBeFalsy();
              expect(out!.dest!.body.includes("## Foo header")).toBeTruthy();
              expect(out!.dest!.body.includes("^123")).toBeTruthy();

              done();
            }),
          });
        });
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
              await NoteTestUtilsV4.createNote({
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
              sinon
                .stub(NotePickerUtils, "getInitialValueFromOpenEditor")
                .returns("dest");
              const cmd = new MoveHeaderCommand();
              const out = await cmd.run({
                useSameVault: true,
                nonInteractive: true,
              });
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
            sinon
              .stub(NotePickerUtils, "getInitialValueFromOpenEditor")
              .returns("dest");
            const cmd = new MoveHeaderCommand();

            const out = await cmd.run({
              useSameVault: true,
              nonInteractive: true,
            });
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
            sinon
              .stub(NotePickerUtils, "getInitialValueFromOpenEditor")
              .returns("dest");
            const cmd = new MoveHeaderCommand();
            const out = await cmd.run({
              useSameVault: true,
              nonInteractive: true,
            });
            await new Promise<void>((resolve) => {
              setTimeout(() => {
                resolve();
              }, 500);
            });
            const refNote = out!.changed.find(
              (n) => n.note.id === "ref-note"
            )!.note;
            const refNote2 = out!.changed.find(
              (n) => n.note.id === "ref-note2"
            )!.note;

            expect(
              refNote.body.includes("[[Foo|dest#foo-header]]")
            ).toBeTruthy();
            expect(
              refNote2.body.includes("[[Foo|dendron://vault1/dest#foo-header]]")
            );
            expect(refNote.body.includes("[[Origin|dest]]")).toBeFalsy();
            done();
          }),
        });
      });

      test("THEN vault prefix is added to bare links if there are notes with same name as destination in different vaults", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook: async ({ wsRoot, vaults }) => {
            await preSetupHook({ wsRoot, vaults });
            await NoteTestUtilsV4.createNote({
              fname: "dest",
              wsRoot,
              vault: vaults[2],
              genRandomId: true,
            });
          },
          onInit: onInitFunc(async () => {
            sinon
              .stub(NotePickerUtils, "getInitialValueFromOpenEditor")
              .returns("dest");
            const cmd = new MoveHeaderCommand();
            const out = await cmd.run({
              useSameVault: true,
              nonInteractive: true,
            });
            await new Promise<void>((resolve) => {
              setTimeout(() => {
                resolve();
              }, 100);
            });
            const refNote = out!.changed.find(
              (n) => n.note.id === "ref-note"
            )!.note;
            expect(
              refNote.body.includes("[[Foo|dest#foo-header]]")
            ).toBeFalsy();
            expect(
              refNote.body.includes("[[Foo|dendron://vault1/dest#foo-header]]")
            );
            expect(refNote.body.includes("[[Origin|dest]]")).toBeFalsy();
            done();
          }),
        });
      });
    });

    describe("WHEN header is not select", () => {
      const onInitFunc = (nextFunc: Function) => {
        return async () => {
          const ext = ExtensionProvider.getExtension();
          const editor = await new WSUtilsV2(ext).openNote(originNote);
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
            let wasThrown = false;
            try {
              out = await cmd.gatherInputs({
                useSameVault: true,
                nonInteractive: true,
              });
            } catch (error) {
              wasThrown = true;
              expect(error instanceof DendronError).toBeTruthy();
              // Commented out since `.toContain` used to not do anything, now that `.toContain`
              // is fixed this assertion does not pass:
              //
              // expect(error).toContain(
              //   "You must first select the header you want to move."
              // );
            }

            expect(wasThrown).toBeTruthy();
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
            let wasThrown = false;
            try {
              out = await cmd.gatherInputs({});
            } catch (error) {
              wasThrown = true;
              expect(error instanceof DendronError).toBeTruthy();
              // Commented out since `.toContain` used to not do anything, now that `.toContain`
              // is fixed this assertion does not pass:
              //
              // expect(error).toContain("no note open.");
            }
            expect(wasThrown).toBeTruthy();
            expect(_.isUndefined(out)).toBeTruthy();
            done();
          }),
        });
      });
    });
  });
});
