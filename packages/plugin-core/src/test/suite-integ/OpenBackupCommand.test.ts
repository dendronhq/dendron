import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import sinon from "sinon";
import * as vscode from "vscode";
import { OpenBackupCommand } from "../../commands/OpenBackupCommand";
import { ExtensionProvider } from "../../ExtensionProvider";
import { describeMultiWS } from "../testUtilsV3";
import { expect } from "../testUtilsv2";
import { describe } from "mocha";
import { VSCodeUtils } from "../../vsCodeUtils";
import path from "path";
import fs from "fs-extra";

suite("OpenBackupCommand", function () {
  describeMultiWS(
    "GIVEN workspace with no backup root",
    {
      preSetupHook: ENGINE_HOOKS.setupBasic,
    },
    () => {
      test("THEN command displays toast indicating no backups", async () => {
        const windowSpy = sinon.spy(vscode.window, "showInformationMessage");
        const ext = ExtensionProvider.getExtension();
        const cmd = new OpenBackupCommand(ext);
        await cmd.run();
        expect(windowSpy.calledOnce).toBeTruthy();
        const infoMessage = windowSpy.getCall(0).args[0];
        expect(infoMessage).toEqual("There are no backups saved.");
        windowSpy.restore();
      });
    }
  );

  describeMultiWS(
    "GIVEN workspace with backup root",
    {
      preSetupHook: ENGINE_HOOKS.setupBasic,
    },
    () => {
      describe("WHEN there is a backup under key `config`", () => {
        test("THEN quickpick shows the filename and selecting it will open the file", async () => {
          const ext = ExtensionProvider.getExtension();
          const wsRoot = ext.getDWorkspace().wsRoot;
          const backupPath = path.join(
            wsRoot,
            ".backup",
            "config",
            "dendron.test.yml"
          );
          fs.ensureFileSync(backupPath);
          fs.writeFileSync(backupPath, "test");
          const quickpickStub = sinon.stub(VSCodeUtils, "showQuickPick");
          quickpickStub.onCall(0).resolves({
            label: "config",
          });
          quickpickStub.onCall(1).resolves({
            label: "dendron.test.yml",
          });

          await VSCodeUtils.closeAllEditors();
          const cmd = new OpenBackupCommand(ext);
          await cmd.run();
          const activeEditor = VSCodeUtils.getActiveTextEditor();
          expect(quickpickStub.getCall(0).args[0]).toEqual([
            {
              label: "config",
              detail: "1 backup(s)",
            },
          ]);
          expect(quickpickStub.getCall(1).args[0]).toEqual([
            {
              label: "dendron.test.yml",
            },
          ]);
          expect(activeEditor?.document.fileName).toEqual(backupPath);
          expect(activeEditor?.document.getText()).toEqual("test");
        });
      });
    }
  );
});
