import { AssertUtils } from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import { describe } from "mocha";
import sinon from "sinon";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { InsertNoteLinkCommand } from "../../commands/InsertNoteLink";
import { VSCodeUtils } from "../../utils";
import { TIMEOUT } from "../testUtils";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite("InsertNoteLink", function () {
  let ctx: vscode.ExtensionContext;
  this.timeout(TIMEOUT);
  ctx = setupBeforeAfter(this);

  describe("basic", () => {
    test("basic", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ engine }) => {
          const notes = engine.notes;
          await VSCodeUtils.openNote(notes["foo"]);
          const cmd = new InsertNoteLinkCommand();
          sinon.stub(cmd, "gatherInputs").returns(
            Promise.resolve({
              notes: [notes["foo"]],
            })
          );
          const editor = VSCodeUtils.getActiveTextEditorOrThrow();
          editor.selection = new vscode.Selection(10, 0, 10, 12);
          await cmd.run();
          const body = editor.document.getText();
          expect(
            await AssertUtils.assertInString({ body, match: ["[[foo]]"] })
          ).toBeTruthy();
          done();
        },
      });
    });

    test("basic multiselect", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ engine }) => {
          const notes = engine.notes;
          await VSCodeUtils.openNote(notes["foo.ch1"]);
          const cmd = new InsertNoteLinkCommand();
          sinon.stub(cmd, "gatherInputs").returns(
            Promise.resolve({
              notes: [notes["foo"], notes["foo.ch1"]],
            })
          );
          const editor = VSCodeUtils.getActiveTextEditorOrThrow();
          editor.selection = new vscode.Selection(10, 0, 10, 12);
          await cmd.run({ multiSelect: true });
          const body = editor.document.getText();
          expect(
            await AssertUtils.assertInString({ body, match: [
              "[[foo]]",
              "[[foo.ch1]]"
            ] })
          ).toBeTruthy();
          done();
        },
      }); 
    })
  });

  describe("alias modes", () => {
    test("snippet", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ engine }) => {
          const notes = engine.notes;
          const cmd = new InsertNoteLinkCommand();
          sinon.stub(cmd, "gatherInputs").returns(
            Promise.resolve({
              notes: [notes["foo"]],
            })
          );
          const editor = VSCodeUtils.getActiveTextEditorOrThrow();
          editor.selection = new vscode.Selection(10, 0, 10, 12);
          await cmd.run({ aliasMode: "snippet" });
          const body = editor.document.getText();
          expect(
            await AssertUtils.assertInString({ body, match: ["[[alias|foo]]"] })
          ).toBeTruthy();
          const { text } = VSCodeUtils.getSelection();
          expect(text).toEqual("alias");
          done();
        },
      });
    });

    test("snippet multiSelect", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ engine }) => {
          const notes = engine.notes;
          const cmd = new InsertNoteLinkCommand();
          sinon.stub(cmd, "gatherInputs").returns(
            Promise.resolve({
              notes: [notes["foo"], notes["foo.ch1"]],
            })
          );
          const editor = VSCodeUtils.getActiveTextEditorOrThrow();
          editor.selection = new vscode.Selection(10, 0, 10, 12);
          await cmd.run({ multiSelect: true, aliasMode: "snippet" });
          const body = editor.document.getText();
          expect(
            await AssertUtils.assertInString({ body, match: [
              "[[alias|foo]]",
              "[[alias|foo.ch1]]"
            ] })
          ).toBeTruthy();
          const { text } = VSCodeUtils.getSelection();
          expect(text).toEqual("alias");
          done();
        },
      });
    });

    test("selection", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ engine }) => {
          const notes = engine.notes;
          await VSCodeUtils.openNote(notes["foo.ch1"]);
          const cmd = new InsertNoteLinkCommand();
          sinon.stub(cmd, "gatherInputs").returns(
            Promise.resolve({
              notes: [notes["foo"]],
            })
          );
          const editor = VSCodeUtils.getActiveTextEditorOrThrow();
          editor.selection = new vscode.Selection(7, 0, 7, 12);
          await cmd.run({ aliasMode: "selection" });
          const body = editor.document.getText();
          expect(
            await AssertUtils.assertInString({ body, match: ["[[foo.ch1 body|foo]]"] })
          ).toBeTruthy();
          done();
        },
      });
    });

    test("selection multiSelect", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ engine }) => {
          const notes = engine.notes;
          await VSCodeUtils.openNote(notes["foo.ch1"]);
          const cmd = new InsertNoteLinkCommand();
          sinon.stub(cmd, "gatherInputs").returns(
            Promise.resolve({
              notes: [notes["foo"], notes["foo.ch1"]],
            })
          );
          const editor = VSCodeUtils.getActiveTextEditorOrThrow();
          editor.selection = new vscode.Selection(7, 0, 7, 12);
          await cmd.run({ multiSelect: true, aliasMode: "selection" });
          const body = editor.document.getText();
          expect(
            await AssertUtils.assertInString({ body, match: [
              "[[foo.ch1 body|foo]]", 
              "[[foo.ch1 body|foo.ch1]]"
            ] })
          ).toBeTruthy();
          done();
        },
      });
    });

    test("title", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ engine }) => {
          const notes = engine.notes;
          await VSCodeUtils.openNote(notes["foo.ch1"]);
          const cmd = new InsertNoteLinkCommand();
          sinon.stub(cmd, "gatherInputs").returns(
            Promise.resolve({
              notes: [notes["foo"]],
            })
          );
          const editor = VSCodeUtils.getActiveTextEditorOrThrow();
          editor.selection = new vscode.Selection(10, 0, 10, 12);
          await cmd.run({ aliasMode: "title" });
          const body = editor.document.getText();
          expect(
            await AssertUtils.assertInString({ body, match: ["[[Foo|foo]]"] })
          ).toBeTruthy();
          done();
        },
      });
    });

    test("title multiSelect", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ engine }) => {
          const notes = engine.notes;
          await VSCodeUtils.openNote(notes["foo.ch1"]);
          const cmd = new InsertNoteLinkCommand();
          sinon.stub(cmd, "gatherInputs").returns(
            Promise.resolve({
              notes: [notes["foo"], notes["foo.ch1"]],
            })
          );
          const editor = VSCodeUtils.getActiveTextEditorOrThrow();
          editor.selection = new vscode.Selection(10, 0, 10, 12);
          await cmd.run({ multiSelect: true, aliasMode: "title" });
          const body = editor.document.getText();
          expect(
            await AssertUtils.assertInString({ body, match: [
              "[[Foo|foo]]",
              "[[Ch1|foo.ch1]]"
            ] })
          ).toBeTruthy();
          done();
        },
      });
    });

    test("prompt", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ engine }) => {
          const notes = engine.notes;
          await VSCodeUtils.openNote(notes["foo.ch1"]);
          const cmd = new InsertNoteLinkCommand();
          sinon.stub(cmd, "gatherInputs").returns(
            Promise.resolve({
              notes: [notes["foo"]],
            })
          );
          sinon.stub(cmd, "promptForAlias").resolves("user input");
          const editor = VSCodeUtils.getActiveTextEditorOrThrow();
          editor.selection = new vscode.Selection(10, 0, 10, 12);
          await cmd.run({ aliasMode: "prompt" });
          const body = editor.document.getText();
          expect(
            await AssertUtils.assertInString({ body, match: ["[[user input|foo]]"] })
          ).toBeTruthy();
          done();
        },
      });
    });

    test("prompt multiSelect", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ engine }) => {
          const notes = engine.notes;
          await VSCodeUtils.openNote(notes["foo.ch1"]);
          const cmd = new InsertNoteLinkCommand();
          sinon.stub(cmd, "gatherInputs").returns(
            Promise.resolve({
              notes: [notes["foo"], notes["foo.ch1"]],
            })
          );
          sinon.stub(cmd, "promptForAlias")
            .onFirstCall().resolves("input 1")
            .onSecondCall().resolves("input 2");
          const editor = VSCodeUtils.getActiveTextEditorOrThrow();
          editor.selection = new vscode.Selection(10, 0, 10, 12);
          await cmd.run({ multiSelect: true, aliasMode: "prompt" });
          const body = editor.document.getText();
          expect(
            await AssertUtils.assertInString({ body, match: [
              "[[input 1|foo]]",
              "[[input 2|foo.ch1]]"
            ] })
          ).toBeTruthy();
          done();
        },
      });
    });

    test("none", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ engine }) => {
          const notes = engine.notes;
          await VSCodeUtils.openNote(notes["foo.ch1"]);
          const cmd = new InsertNoteLinkCommand();
          sinon.stub(cmd, "gatherInputs").returns(
            Promise.resolve({
              notes: [notes["foo"]],
            })
          );
          const editor = VSCodeUtils.getActiveTextEditorOrThrow();
          editor.selection = new vscode.Selection(10, 0, 10, 12);
          await cmd.run({ aliasMode: "none" });
          const body = editor.document.getText();
          expect(
            await AssertUtils.assertInString({ body, match: ["[[foo]]"] })
          ).toBeTruthy();
          done();
        },
      });
    });

    test("none multiSelect", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ engine }) => {
          const notes = engine.notes;
          await VSCodeUtils.openNote(notes["foo.ch1"]);
          const cmd = new InsertNoteLinkCommand();
          sinon.stub(cmd, "gatherInputs").returns(
            Promise.resolve({
              notes: [notes["foo"], notes["foo.ch1"]],
            })
          );
          const editor = VSCodeUtils.getActiveTextEditorOrThrow();
          editor.selection = new vscode.Selection(10, 0, 10, 12);
          await cmd.run({ multiSelect: true, aliasMode: "none" });
          const body = editor.document.getText();
          expect(
            await AssertUtils.assertInString({ body, match: [
              "[[foo]]",
              "[[foo.ch1]]"
            ] })
          ).toBeTruthy();
          done();
        },
      });
    });
  });
});
