import * as vscode from "vscode";
import { CreateDailyJournalCommand } from "../../commands/CreateDailyJournal";
import { expect } from "../testUtilsv2";
import {
  runLegacyMultiWorkspaceTest,
  setupBeforeAfter,
  withConfig,
  EditorUtils,
} from "../testUtilsV3";
import { DVault, VaultUtils } from "@dendronhq/common-all";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import _ from "lodash";
import { PickerUtilsV2 } from "../../components/lookup/utils";
import { getActiveEditorBasename } from "../testUtils";
import { CONFIG } from "../../constants";
import { VSCodeUtils } from "../../utils";
import sinon from "sinon";

const stubVaultPick = (vaults: DVault[]) => {
  const vault = _.find(vaults, { fsPath: vaults[2].fsPath });
  sinon.stub(PickerUtilsV2, "promptVault").returns(Promise.resolve(vault));
  return vault;
};

suite("Create Daily Journal Suite", function () {
  let ctx: vscode.ExtensionContext;

  ctx = setupBeforeAfter(this);

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

  test("default journal vault", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      onInit: async ({ wsRoot, vaults }) => {
        withConfig(
          (config) => {
            config.lookupConfirmVaultOnCreate = false;
            config.journal!.dailyVault = VaultUtils.getName(vaults[0]);
            return config;
          },
          { wsRoot }
        );
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

  test("default journal vault set with lookup Confirm", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      onInit: async ({ wsRoot, vaults }) => {
        withConfig(
          (config) => {
            config.lookupConfirmVaultOnCreate = true;
            config.journal!.dailyVault = VaultUtils.getName(vaults[0]);
            return config;
          },
          { wsRoot }
        );
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

  test("default journal vault not set with lookup Confirm", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      onInit: async ({ wsRoot, vaults }) => {
        withConfig(
          (config) => {
            config.lookupConfirmVaultOnCreate = true;
            return config;
          },
          { wsRoot }
        );
        stubVaultPick(vaults);
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

  test("with config override", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      modConfigCb: (config) => {
        config.journal!.dailyDomain = "bar";
        return config;
      },
      onInit: async () => {
        await new CreateDailyJournalCommand().run();
        expect(
          getActiveEditorBasename().startsWith("bar.journal")
        ).toBeTruthy();
        done();
      },
    });
  });

  test("ignores deprecated config", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      wsSettingsOverride: {
        settings: {
          [CONFIG.DEFAULT_JOURNAL_DATE_FORMAT.key]: "'q'q",
          [CONFIG.DEFAULT_JOURNAL_ADD_BEHAVIOR.key]: "childOfCurrent",
          [CONFIG.DAILY_JOURNAL_DOMAIN.key]: "daisy",
          [CONFIG.DEFAULT_JOURNAL_NAME.key]: "journey",
        },
      },
      modConfigCb: (config) => {
        config.journal!.dateFormat = "dd";
        config.journal!.dailyDomain = "daisy";
        config.journal!.name = "journey";
        return config;
      },
      onInit: async ({ wsRoot, vaults }) => {
        const current = await NoteTestUtilsV4.createNote({
          wsRoot,
          vault: vaults[0],
          fname: "foo.bar.baz",
        });
        await VSCodeUtils.openNote(current);
        await new CreateDailyJournalCommand().run();
        const fname = getActiveEditorBasename();
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, "0");
        expect(fname).toEqual(`daisy.journey.${dd}.md`);
        done();
      },
    });
  });
});
