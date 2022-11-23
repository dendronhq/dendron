import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import * as vscode from "vscode";
import { ExtensionProvider } from "../../ExtensionProvider";
import { getReferenceAtPosition } from "../../utils/md";
import { WSUtils } from "../../WSUtils";
import { expect } from "../testUtilsv2";
import { describeMultiWS, setupBeforeAfter } from "../testUtilsV3";

suite("WHEN getReferenceAtPosition", function () {
  const ctx = setupBeforeAfter(this);
  const activeNoteName = "active";

  describeMultiWS(
    "AND WHEN header anchor is present",
    {
      preSetupHook: async ({ wsRoot, vaults }) => {
        return NoteTestUtilsV4.createNote({
          fname: activeNoteName,
          vault: vaults[0],
          wsRoot,
          body: "[[foo#foo1]]",
        });
      },
      ctx,
    },
    () => {
      test("THEN initializes correctly", async () => {
        // You can access the workspace inside the test like this:
        const ws = ExtensionProvider.getDWorkspace();
        const { engine, wsRoot } = ws;
        const vaults = await ws.vaults;
        const activeNote = (await engine.getNoteMeta(activeNoteName)).data!;
        const editor = await WSUtils.openNote(activeNote);
        const position = new vscode.Position(7, 0);
        const reference = await getReferenceAtPosition({
          document: editor.document,
          position,
          wsRoot,
          vaults,
        });
        expect(reference).toEqual({
          anchorEnd: undefined,
          anchorStart: {
            type: "header",
            value: "foo1",
          },
          label: "",
          range: new vscode.Range(
            new vscode.Position(7, 0),
            new vscode.Position(7, 12)
          ),
          ref: "foo",
          refText: "foo#foo1",
          refType: "wiki",
          vaultName: undefined,
        });
        return;
      });
    }
  );
});
