import { vault2Path } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { ReloadIndexCommand } from "../../commands/ReloadIndex";
import { expect } from "../testUtilsv2";
import { describeMultiWS, describeSingleWS } from "../testUtilsV3";
import { test, before } from "mocha";
import { ExtensionProvider } from "../../ExtensionProvider";
import { NoteUtils, VaultUtils } from "@dendronhq/common-all";

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
});
