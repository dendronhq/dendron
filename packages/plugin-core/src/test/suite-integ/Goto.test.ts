import { DendronError } from "@dendronhq/common-all";
import { runMochaHarness } from "@dendronhq/common-test-utils";
import { describe } from "mocha";
import sinon from "sinon";
import * as vscode from "vscode";
import { GotoCommand } from "../../commands/Goto";
import { TargetKind } from "../../commands/GoToNoteInterface";
import { IDendronExtension } from "../../dendronExtensionInterface";
import { ExtensionProvider } from "../../ExtensionProvider";
import { GOTO_NOTE_PRESETS } from "../presets/GotoNotePreset";
import { expect } from "../testUtilsv2";
import { describeMultiWS } from "../testUtilsV3";

const executeGotoCmd = async (ext: IDendronExtension) => {
  // return vscode.commands.executeCommand(DENDRON_COMMANDS.GOTO.key);
  return new GotoCommand(ext).execute();
};

/* Before each candidate */
// const ext = ExtensionProvider.getExtension();
// vscode.commands.executeCommand(DENDRON_COMMANDS.GOTO.key);

suite("GotoNote", function () {
  describe("WHEN note link is selected", () => {
    describeMultiWS(
      GOTO_NOTE_PRESETS.LINK_IN_CODE_BLOCK.label,
      {
        preSetupHook: GOTO_NOTE_PRESETS.LINK_IN_CODE_BLOCK.preSetupHook,
      },
      () => {
        test("THEN goto note", async () => {
          const ext = ExtensionProvider.getExtension();
          await GOTO_NOTE_PRESETS.LINK_IN_CODE_BLOCK.beforeTestResults({ ext });
          await executeGotoCmd(ext);
          await runMochaHarness(GOTO_NOTE_PRESETS.LINK_IN_CODE_BLOCK.results);
        });
      }
    );

    describeMultiWS(
      GOTO_NOTE_PRESETS.LINK_TO_NOTE_IN_SAME_VAULT.label,
      {
        preSetupHook: GOTO_NOTE_PRESETS.LINK_TO_NOTE_IN_SAME_VAULT.preSetupHook,
      },
      () => {
        test("THEN goto note", async () => {
          const ext = ExtensionProvider.getExtension();
          await GOTO_NOTE_PRESETS.LINK_TO_NOTE_IN_SAME_VAULT.beforeTestResults({
            ext,
          });
          await executeGotoCmd(ext);
          await runMochaHarness(
            GOTO_NOTE_PRESETS.LINK_TO_NOTE_IN_SAME_VAULT.results
          );
        });
      }
    );

    describeMultiWS(
      "WHEN link to note with uri http",
      {
        preSetupHook: GOTO_NOTE_PRESETS.LINK_TO_NOTE_WITH_URI_HTTP.preSetupHook,
      },
      () => {
        test("THEN goto note", async () => {
          const ext = ExtensionProvider.getExtension();
          await GOTO_NOTE_PRESETS.LINK_TO_NOTE_WITH_URI_HTTP.beforeTestResults({
            ext,
          });
          const cmd = new GotoCommand(ext);
          const openLinkMethod = sinon.stub(
            cmd,
            "openLink" as keyof GotoCommand
          );
          await cmd.execute();
          expect(openLinkMethod.calledOnce).toBeTruthy();
        });
      }
    );
  });

  describe("WHEN external link is selected", () => {
    describeMultiWS(
      GOTO_NOTE_PRESETS.VALID_URL.label,
      {
        preSetupHook: GOTO_NOTE_PRESETS.VALID_URL.preSetupHook,
      },
      () => {
        test("THEN goto the external link", async () => {
          const ext = ExtensionProvider.getExtension();
          await GOTO_NOTE_PRESETS.VALID_URL.beforeTestResults({ ext });

          /* Prevent the test to actually open the link */
          const avoidPopUp = sinon.stub(vscode.env, "openExternal");
          const { data } = await executeGotoCmd(ext);
          expect(data).toContain({
            kind: TargetKind.LINK,
            fullPath: "https://www.dendron.so/",
            fromProxy: false,
          });
          avoidPopUp.restore();
        });
      }
    );

    describeMultiWS(
      GOTO_NOTE_PRESETS.PARTIAL_URL.label,
      {
        preSetupHook: GOTO_NOTE_PRESETS.PARTIAL_URL.preSetupHook,
      },
      () => {
        test("THEN error message should show up", async () => {
          const ext = ExtensionProvider.getExtension();
          await GOTO_NOTE_PRESETS.PARTIAL_URL.beforeTestResults({ ext });
          const { error } = (await executeGotoCmd(ext)) as {
            error: DendronError | undefined;
          };
          expect(error?.message).toEqual("no valid path or URL selected");
        });
      }
    );
  });

  describeMultiWS(
    GOTO_NOTE_PRESETS.NO_LINK.label,
    { preSetupHook: GOTO_NOTE_PRESETS.NO_LINK.preSetupHook },
    () => {
      test("THEN error message should show up", async () => {
        const ext = ExtensionProvider.getExtension();
        await GOTO_NOTE_PRESETS.NO_LINK.beforeTestResults({ ext });
        const { error } = (await executeGotoCmd(ext)) as {
          error: DendronError | undefined;
        };
        expect(error?.message).toEqual("no valid path or URL selected");
      });
    }
  );
});
