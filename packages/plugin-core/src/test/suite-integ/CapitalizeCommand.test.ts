import * as vscode from "vscode";
import * as utils from "../../utils";
import { CapitalizeCommand } from "../../commands/Capitalize";
import { runLegacySingleWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";
import { sinon } from "@dendronhq/common-test-utils";
import _ from "lodash";
import { expect } from "../testUtilsv2";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { DendronWorkspace, getWS } from "../../workspace";
import { DVault, NoteUtils } from "@dendronhq/common-all";

suite("CapitalizeCommand", function () {
  let ctx: vscode.ExtensionContext;

  ctx = setupBeforeAfter(this, {
    afterHook: () => {
      sinon.restore();
    },
  });

  function createNoteHook(fname: string, body: string) {
    // Create a postSetupHook that creates a note with the provided fname and body.
    return async ({ wsRoot, vaults }: { wsRoot: string; vaults: DVault[] }) => {
      await NoteTestUtilsV4.createNote({
        vault: vaults[0],
        wsRoot,
        fname,
        body,
      });
    };
  }
  async function openNote(fname: string, vaults: DVault[]) {
    // Open the note created by createNoteHook's hook
    const wsRoot = DendronWorkspace.wsRoot();
    const notes = getWS().getEngine().notes;
    const vault = vaults[0];
    const note = NoteUtils.getNoteByFnameV5({ fname, notes, vault, wsRoot });
    const editor = await utils.VSCodeUtils.openNote(note!);
    return editor;
  }

  test("basic", (done) => {
    const fname = "test.hello-world";
    runLegacySingleWorkspaceTest({
      ctx,
      postSetupHook: createNoteHook(fname, "hello, world!"),
      onInit: async ({ vaults }) => {
        const editor = await openNote(fname, vaults);
        editor.selection = new vscode.Selection(7, 0, 7, 13);

        const capitalized = await new CapitalizeCommand().run();
        expect(capitalized).toEqual("Hello, World!");
        done();
      },
    });
  });
  test("single letters", (done) => {
    const fname = "test.single-letters";
    runLegacySingleWorkspaceTest({
      ctx,
      postSetupHook: createNoteHook(fname, "a b x y l m n"),
      onInit: async ({ vaults }) => {
        const editor = await openNote(fname, vaults);
        editor.selection = new vscode.Selection(7, 0, 7, 13);

        const capitalized = await new CapitalizeCommand().run();
        expect(capitalized).toEqual("A B X Y L M N");
        done();
      },
    });
  });
  test("nothing selected", (done) => {
    const fname = "test.nothing-selected";
    runLegacySingleWorkspaceTest({
      ctx,
      postSetupHook: createNoteHook(fname, "hello, world!"),
      onInit: async ({ vaults }) => {
        const editor = await openNote(fname, vaults);
        editor.selection = new vscode.Selection(7, 0, 7, 0);

        const capitalized = await new CapitalizeCommand().run();
        expect(capitalized).toEqual("");
        done();
      },
    });
  });
  test("partial selection", (done) => {
    const fname = "test.partial-selection";
    runLegacySingleWorkspaceTest({
      ctx,
      postSetupHook: createNoteHook(fname, "hello, world!"),
      onInit: async ({ vaults }) => {
        const editor = await openNote(fname, vaults);
        editor.selection = new vscode.Selection(7, 0, 7, 5);

        const capitalized = await new CapitalizeCommand().run();
        expect(capitalized).toEqual("Hello");
        done();
      },
    });
  });
  test("numbers and punctuation", (done) => {
    const fname = "test.numbers-and-punctuation";
    runLegacySingleWorkspaceTest({
      ctx,
      postSetupHook: createNoteHook(
        fname,
        "123 lorem 2hello ! world dolor !!! ! ?"
      ),
      onInit: async ({ vaults }) => {
        const editor = await openNote(fname, vaults);
        editor.selection = new vscode.Selection(7, 0, 7, 38);

        const capitalized = await new CapitalizeCommand().run();
        expect(capitalized).toEqual("123 Lorem 2hello ! World Dolor !!! ! ?");
        done();
      },
    });
  });
  test("maintains whitespace", (done) => {
    const fname = "test.maintains-whitespace";
    runLegacySingleWorkspaceTest({
      ctx,
      postSetupHook: createNoteHook(fname, "eggs,   ham,           spam!"),
      onInit: async ({ vaults }) => {
        const editor = await openNote(fname, vaults);
        editor.selection = new vscode.Selection(7, 0, 7, 28);

        const capitalized = await new CapitalizeCommand().run();
        expect(capitalized).toEqual("Eggs,   Ham,           Spam!");
        done();
      },
    });
  });
  test("preserves letters already capitalized", (done) => {
    const fname = "test.preserves-letters-already-capitalized";
    runLegacySingleWorkspaceTest({
      ctx,
      postSetupHook: createNoteHook(fname, "Lorem ipsum Dolor amet"),
      onInit: async ({ vaults }) => {
        const editor = await openNote(fname, vaults);
        editor.selection = new vscode.Selection(7, 0, 7, 28);

        const capitalized = await new CapitalizeCommand().run();
        expect(capitalized).toEqual("Lorem Ipsum Dolor Amet");
        done();
      },
    });
  });
});
