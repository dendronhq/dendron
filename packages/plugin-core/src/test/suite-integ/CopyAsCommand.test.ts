import { CopyAsFormat } from "@dendronhq/pods-core";
import { describe } from "mocha";
import sinon from "sinon";
import { CopyAsCommand } from "../../commands/CopyAsCommand";
import { PodUIControls } from "../../components/pods/PodControls";
import { ExtensionProvider } from "../../ExtensionProvider";
import { WSUtilsV2 } from "../../WSUtilsV2";
import { describeSingleWS } from "../testUtilsV3";
import { expect } from "../testUtilsv2";
import { PodCommandFactory } from "../../components/pods/PodCommandFactory";
import { VSCodeUtils } from "../../vsCodeUtils";
import { window } from "vscode";

suite("CopyAsCommand", function () {
  describe("GIVEN CopyAs command is run", () => {
    describeSingleWS(
      "WHEN the format selected is JSON",
      { timeout: 5e3 },
      () => {
        test("THEN json formatted note must be copied to clipboard", async () => {
          const { engine } = ExtensionProvider.getDWorkspace();
          const targetNote = (await engine.findNotes({ fname: "root" }))[0];
          await WSUtilsV2.instance().openNote(targetNote);
          const factorySpy = sinon.spy(
            PodCommandFactory,
            "createPodCommandForStoredConfig"
          );
          const cmd = new CopyAsCommand();
          sinon
            .stub(PodUIControls, "promptToSelectCopyAsFormat")
            .resolves(CopyAsFormat.JSON);
          await cmd.run();
          const out = factorySpy.returnValues[0];
          expect(out.key).toEqual("dendron.jsonexportv2");
        });
        test("AND NO note is open THEN throw error", async () => {
          await VSCodeUtils.closeAllEditors();

          const windowSpy = sinon.spy(window, "showErrorMessage");
          const cmd = new CopyAsCommand();
          await cmd.run();
          const errorMsg = windowSpy.getCall(0).args[0];
          expect(errorMsg).toEqual(
            "you must have a note open to execute this command"
          );
        });
      }
    );
    describeSingleWS(
      "WHEN the format selected is Markdown",
      { timeout: 5e3 },
      () => {
        test("THEN markdown formatted note must be copied to clipboard", async () => {
          const { engine } = ExtensionProvider.getDWorkspace();
          const targetNote = (await engine.findNotes({ fname: "root" }))[0];
          await WSUtilsV2.instance().openNote(targetNote);
          const factorySpy = sinon.spy(
            PodCommandFactory,
            "createPodCommandForStoredConfig"
          );
          const cmd = new CopyAsCommand();
          sinon
            .stub(PodUIControls, "promptToSelectCopyAsFormat")
            .resolves(CopyAsFormat.MARKDOWN);
          await cmd.run();
          const out = factorySpy.returnValues[0];
          expect(out.key).toEqual("dendron.markdownexportv2");
        });
      }
    );
    describeSingleWS(
      "WHEN the Markdown format is provided in keybinding args",
      { timeout: 5e3 },
      () => {
        test("THEN markdown formatted note must be copied to clipboard", async () => {
          const { engine } = ExtensionProvider.getDWorkspace();
          const targetNote = (await engine.findNotes({ fname: "root" }))[0];
          await WSUtilsV2.instance().openNote(targetNote);
          const factorySpy = sinon.spy(
            PodCommandFactory,
            "createPodCommandForStoredConfig"
          );
          const cmd = new CopyAsCommand();
          await cmd.gatherInputs(CopyAsFormat.MARKDOWN);
          const out = factorySpy.returnValues[0];
          expect(out.key).toEqual("dendron.markdownexportv2");
        });
      }
    );
  });
});
