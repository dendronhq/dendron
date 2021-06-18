import * as vscode from "vscode";
import { CreateDailyJournalCommand } from "../../commands/CreateDailyJournal";
import { expect } from "../testUtilsv2";
import {
  runLegacyMultiWorkspaceTest,
  setupBeforeAfter,
  withConfig,
  EditorUtils,
} from "../testUtilsV3";
import { DVault } from "@dendronhq/common-all";
import { sinon } from "@dendronhq/common-test-utils";
import _ from "lodash";
import { PickerUtilsV2 } from "../../components/lookup/utils";
import { getActiveEditorBasename } from "../testUtils";

const stubVaultPick = (vaults: DVault[]) => {
  const vault = _.find(vaults, { fsPath: vaults[2].fsPath });
  sinon.stub(PickerUtilsV2, "promptVault").returns(Promise.resolve(vault));
  return vault;
};

suite("Daily Journal Suite", function () {
  let ctx: vscode.ExtensionContext;
  test("basic", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      onInit: async ({}) => {
        await new CreateDailyJournalCommand().run();
        expect(
          getActiveEditorBasename().startsWith("daily.journal")
        ).toBeTruthy();
        done();
      },
    });
  });
});

suite("CreateDailyJournal", function () {
  let ctx: vscode.ExtensionContext;

  ctx = setupBeforeAfter(this, {});

  test("default journal vault", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      onInit: async ({ wsRoot, vaults }) => {
        withConfig(
          (config) => {
            config.lookupConfirmVaultOnCreate = false;
            config.defaultDailyJournalVault = vaults[0].fsPath;
            return config;
          },
          { wsRoot }
        );
        stubVaultPick(vaults);
        await new CreateDailyJournalCommand().run();
        expect(
          (await EditorUtils.getURIForActiveEditor()).fsPath.includes(
            vaults[0].fsPath
          )
        ).toBeTruthy();
        done();
      },
    });
  });

  test("default journal vault with lookup Confirm", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      onInit: async ({ wsRoot, vaults }) => {
        withConfig(
          (config) => {
            config.lookupConfirmVaultOnCreate = true;
            config.defaultDailyJournalVault = vaults[0].fsPath;
            return config;
          },
          { wsRoot }
        );
        await new CreateDailyJournalCommand().run();
        expect(
          (await EditorUtils.getURIForActiveEditor()).fsPath.includes(
            vaults[2].fsPath
          )
        ).toBeTruthy();
        done();
      },
    });
  });
});
