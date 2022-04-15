import { vault2Path } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import {
  FIX_CONFIG_SELF_CONTAINED,
  ReloadIndexCommand,
} from "../../commands/ReloadIndex";
import { expect } from "../testUtilsv2";
import { describeMultiWS, describeSingleWS } from "../testUtilsV3";
import { test, before } from "mocha";
import { ExtensionProvider } from "../../ExtensionProvider";
import { NoteUtils, VaultUtils } from "@dendronhq/common-all";
import { DConfig } from "@dendronhq/engine-server";
import { MessageItem, window } from "vscode";
import sinon from "sinon";
import { VSCodeUtils } from "../../vsCodeUtils";

suite("GIVEN ReloadIndex", function () {
  describeSingleWS("WHEN root files are missing", {}, () => {
    let rootFiles: string[] = [];
    before(async () => {
      const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
      const vaultDir = vault2Path({ vault: vaults[0], wsRoot });
      rootFiles = [
        path.join(vaultDir, "root.md"),
        path.join(vaultDir, "root.schema.yml"),
      ];
      await Promise.all(rootFiles.map((ent) => fs.remove(ent)));

      await new ReloadIndexCommand().run();
    });

    test("THEN the root files are recreated", async () => {
      expect(
        _.every(await Promise.all(rootFiles.map((ent) => fs.pathExists(ent))))
      ).toBeTruthy();
    });
  });

  describeSingleWS("WHEN root files exist", {}, () => {
    let rootFiles: string[] = [];
    before(async () => {
      const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
      const vaultDir = vault2Path({ vault: vaults[0], wsRoot });
      rootFiles = [
        path.join(vaultDir, "root.md"),
        path.join(vaultDir, "root.schema.yml"),
      ];
      await Promise.all([
        fs.appendFile(rootFiles[0], "bond", { encoding: "utf8" }),
        fs.appendFile(rootFiles[1], "# bond", { encoding: "utf8" }),
      ]);

      await new ReloadIndexCommand().run();
    });

    test("THEN the root files are not overwritten", async () => {
      expect(
        _.every(
          await Promise.all(
            rootFiles.map(async (ent) =>
              (await fs.readFile(ent)).includes("bond")
            )
          )
        )
      ).toBeTruthy();
    });
  });

  describeMultiWS("WHEN there is a single vault missing", {}, () => {
    before(async () => {
      const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
      const vaultPath = vault2Path({ vault: vaults[0], wsRoot });
      await fs.rmdir(vaultPath, { recursive: true });
    });

    test("THEN other vaults are still loaded", async () => {
      const engine = await new ReloadIndexCommand().run();
      const { vaults } = ExtensionProvider.getDWorkspace();
      expect(engine).toBeTruthy();
      const notes = _.sortBy(
        NoteUtils.getNotesByFnameFromEngine({
          engine: engine!,
          fname: "root",
        }),
        (note) => path.basename(note.vault.fsPath)
      );
      expect(notes.length).toEqual(2);
      expect(VaultUtils.isEqualV2(notes[0].vault, vaults[1])).toBeTruthy();
      expect(VaultUtils.isEqualV2(notes[1].vault, vaults[2])).toBeTruthy();
    });
  });

  describeSingleWS(
    "WHEN a self contained vault is misconfigured",
    {
      selfContained: true,
      postSetupHook: async ({ wsRoot }) => {
        const config = DConfig.getOrCreate(wsRoot);
        expect(config.workspace.vaults.length).toEqual(1);
        delete config.workspace.vaults[0].selfContained;
        await DConfig.writeConfig({ wsRoot, config });
      },
    },
    () => {
      test("THEN it prompts to fix the config", async () => {
        const { wsRoot } = ExtensionProvider.getDWorkspace();
        sinon
          .stub(window, "showWarningMessage")
          // Cast needed because sinon doesn't get which overload we're stubbing
          .resolves(FIX_CONFIG_SELF_CONTAINED as unknown as MessageItem);
        const reloadWindow = sinon.stub(VSCodeUtils, "reloadWindow");

        await ReloadIndexCommand.checkAndPromptForMisconfiguredSelfContainedVaults(
          { engine: ExtensionProvider.getEngine() }
        );

        // Should reload window after fixing so the plugin picks up new vault config
        expect(reloadWindow.calledOnce).toBeTruthy();
        // The config should be updated to mark the vault as self contained
        const configAfter = DConfig.getOrCreate(wsRoot);
        expect(configAfter.workspace.vaults[0].selfContained).toBeTruthy();
      });
    }
  );
});
