import { DendronError, DVault, VaultUtils } from "@dendronhq/common-all";
import _ from "lodash";
import path from "path";
import { runEngineTestV5 } from "../../engine";

describe("VaultUtils", () => {
  describe("getVaultByPath", () => {
    test("basic", async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot }) => {
          const { vaults } = engine;
          const fsPath = path.join(wsRoot, "vault1");
          expect(
            VaultUtils.getVaultByDirPath({ vaults, wsRoot, fsPath })
          ).toEqual(_.find(engine.vaults, (ent) => ent.fsPath === "vault1"));
        },
        {
          expect,
        }
      );
    });

    test("If no vault with exact name exists, return dendron error", async () => {
      await runEngineTestV5(
        async ({ wsRoot }) => {
          const test: DVault[] = [{ fsPath: "vault" }];
          const fsPath = path.join(wsRoot, "vault1");
          expect(() =>
            VaultUtils.getVaultByDirPath({ vaults: test, wsRoot, fsPath })
          ).toThrow(DendronError);
        },
        {
          expect,
        }
      );
    });

    test("workspace vault", async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot }) => {
          const { vaults } = engine;
          const fsPath = path.join(wsRoot, "vault1");
          const fsPath2 = path.join(wsRoot, "foo", "vault2");
          expect(
            VaultUtils.getVaultByDirPath({ vaults, wsRoot, fsPath })
          ).toEqual(_.find(engine.vaults, (ent) => ent.fsPath === "vault1"));
          expect(
            VaultUtils.getVaultByDirPath({ vaults, wsRoot, fsPath: fsPath2 })
          ).toEqual(_.find(engine.vaults, (ent) => ent.fsPath === "vault2"));
        },
        {
          expect,
          vaults: [
            { fsPath: "vault1" },
            { fsPath: "vault2", workspace: "foo" },
            { fsPath: "vault3", name: "vaultThree" },
          ],
        }
      );
    });
  });
});
