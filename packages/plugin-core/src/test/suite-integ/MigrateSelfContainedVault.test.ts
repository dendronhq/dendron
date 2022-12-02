import { SinonStubbedFn } from "@dendronhq/common-test-utils";
import sinon from "sinon";
import { window } from "vscode";
import {
  MigrateSelfContainedVaultCommand,
  MigrateVaultContinueOption,
} from "../../commands/MigrateSelfContainedVault";
import { ExtensionProvider } from "../../ExtensionProvider";
import { VSCodeUtils } from "../../vsCodeUtils";
import { describeMultiWS, describeSingleWS } from "../testUtilsV3";
import { suite, test, before, after } from "mocha";
import { expect } from "../testUtilsv2";
import {
  ConfigUtils,
  CONSTANTS,
  DVault,
  FOLDERS,
  DendronConfig,
  VaultUtils,
  ConfigService,
  URI,
} from "@dendronhq/common-all";
import fs from "fs-extra";
import path from "path";
import { WorkspaceService } from "@dendronhq/engine-server";
import { pathForVaultRoot } from "@dendronhq/common-server";

function stubMigrateQuickPick(
  vaultSelect: string,
  continueOption:
    | MigrateVaultContinueOption
    | undefined = MigrateVaultContinueOption.continue
): SinonStubbedFn<typeof VSCodeUtils["showQuickPick"]> {
  const stub = sinon.stub(VSCodeUtils, "showQuickPick");
  stub.onFirstCall().resolves({
    label: vaultSelect,
  });
  stub.onSecondCall().resolves({ label: continueOption });
  return stub;
}

suite("GIVEN the MigrateSelfContainedVault command", () => {
  describeSingleWS(
    "WHEN the vault prompt is cancelled",
    { selfContained: false },
    () => {
      let showErrorMessage: SinonStubbedFn<typeof window["showErrorMessage"]>;
      let reloadWindow: SinonStubbedFn<typeof VSCodeUtils["reloadWindow"]>;
      let showQuickPick: SinonStubbedFn<typeof VSCodeUtils["showQuickPick"]>;

      before(async () => {
        const cmd = new MigrateSelfContainedVaultCommand(
          ExtensionProvider.getExtension()
        );

        showErrorMessage = sinon.stub(window, "showErrorMessage");
        reloadWindow = sinon.stub(VSCodeUtils, "reloadWindow");
        showQuickPick = sinon
          .stub(VSCodeUtils, "showQuickPick")
          .resolves(undefined);

        await cmd.run();
      });
      after(() => {
        [showErrorMessage, reloadWindow, showQuickPick].forEach((stub) =>
          stub.restore()
        );
      });

      test("THEN the workspace did not reload since there was no migration", () => {
        expect(reloadWindow.called).toBeFalsy();
      });

      test("THEN the vault should not have migrated", async () => {
        const ws = ExtensionProvider.getDWorkspace();
        const { wsRoot } = ws;
        const vaults = await ws.vaults;
        expect(
          await verifyVaultNotMigrated({ wsRoot, vault: vaults[0] })
        ).toBeTruthy();
      });
    }
  );

  describeSingleWS(
    "WHEN the backup prompt is cancelled",
    { selfContained: false },
    () => {
      let showErrorMessage: SinonStubbedFn<typeof window["showErrorMessage"]>;
      let reloadWindow: SinonStubbedFn<typeof VSCodeUtils["reloadWindow"]>;
      let showQuickPick: SinonStubbedFn<typeof VSCodeUtils["showQuickPick"]>;

      before(async () => {
        const cmd = new MigrateSelfContainedVaultCommand(
          ExtensionProvider.getExtension()
        );

        showErrorMessage = sinon.stub(window, "showErrorMessage");
        reloadWindow = sinon.stub(VSCodeUtils, "reloadWindow");
        const vaults = await ExtensionProvider.getDWorkspace().vaults;
        showQuickPick = stubMigrateQuickPick(
          VaultUtils.getName(vaults[0]),
          MigrateVaultContinueOption.cancel
        );

        await cmd.run();
      });
      after(() => {
        [showErrorMessage, reloadWindow, showQuickPick].forEach((stub) =>
          stub.restore()
        );
      });

      test("THEN the workspace did not reload since there was no migration", () => {
        expect(reloadWindow.called).toBeFalsy();
      });

      test("THEN the vault should not have migrated", async () => {
        const ws = ExtensionProvider.getDWorkspace();
        const { wsRoot } = ws;
        const vaults = await ws.vaults;
        expect(
          await verifyVaultNotMigrated({ wsRoot, vault: vaults[0] })
        ).toBeTruthy();
      });
    }
  );

  describeSingleWS(
    "WHEN there's only a single vault, and it's self contained",
    { selfContained: true },
    () => {
      let showErrorMessage: SinonStubbedFn<typeof window["showErrorMessage"]>;
      let reloadWindow: SinonStubbedFn<typeof VSCodeUtils["reloadWindow"]>;
      let showQuickPick: SinonStubbedFn<typeof VSCodeUtils["showQuickPick"]>;

      before(async () => {
        const cmd = new MigrateSelfContainedVaultCommand(
          ExtensionProvider.getExtension()
        );

        showErrorMessage = sinon.stub(window, "showErrorMessage");
        reloadWindow = sinon.stub(VSCodeUtils, "reloadWindow");
        showQuickPick = sinon.stub(VSCodeUtils, "showQuickPick");

        await cmd.run();
      });
      after(() => {
        [showErrorMessage, reloadWindow, showQuickPick].forEach((stub) =>
          stub.restore()
        );
      });

      test("THEN there's an error that there's nothing to migrate", () => {
        expect(showErrorMessage.calledOnce).toBeTruthy();
        expect(showErrorMessage.args[0][0].includes("no vault")).toBeTruthy();
      });

      test("THEN no vault is prompted for", () => {
        expect(showQuickPick.called).toBeFalsy();
      });

      test("THEN the workspace did not reload since there was no migration", () => {
        expect(reloadWindow.called).toBeFalsy();
      });
    }
  );

  describeSingleWS(
    "WHEN there's only a single vault, and it's not self contained",
    {
      selfContained: false,
      modConfigCb: (config) => {
        const vault = ConfigUtils.getVaults(config)[0];
        // Using an asset in the vault as the logo. Migration should update the path.
        ConfigUtils.setPublishProp(
          config,
          "logoPath",
          `${vault.fsPath}/assets/image.png`
        );
        return config;
      },
      postSetupHook: async ({ wsRoot, vaults }) => {
        const vaultPath = pathForVaultRoot({ wsRoot, vault: vaults[0] });
        // Mock git folder & files to see if migration handles them.
        await fs.ensureDir(path.join(vaultPath, ".git"));
        await fs.writeFile(path.join(vaultPath, ".gitignore"), "");
        // Also mock the logo file
        await fs.ensureDir(path.join(vaultPath, "assets"));
        await fs.writeFile(path.join(vaultPath, "assets", "image.png"), "");
      },
    },
    () => {
      let reloadWindow: SinonStubbedFn<typeof VSCodeUtils["reloadWindow"]>;
      let showQuickPick: SinonStubbedFn<typeof VSCodeUtils["showQuickPick"]>;

      before(async () => {
        const vaults = await ExtensionProvider.getDWorkspace().vaults;
        const cmd = new MigrateSelfContainedVaultCommand(
          ExtensionProvider.getExtension()
        );

        reloadWindow = sinon.stub(VSCodeUtils, "reloadWindow");
        showQuickPick = stubMigrateQuickPick(VaultUtils.getName(vaults[0]));

        await cmd.run();
      });
      after(() => {
        [reloadWindow, showQuickPick].forEach((stub) => stub.restore());
      });

      test("THEN it prompts for the vault and confirmation", () => {
        expect(showQuickPick.callCount).toEqual(2);
      });

      test("THEN the workspace reloads to apply the migration", () => {
        expect(reloadWindow.called).toBeTruthy();
      });

      test("THEN the vault is migrated", async () => {
        const ws = ExtensionProvider.getDWorkspace();
        const { wsRoot } = ws;
        const vaults = await ws.vaults;
        expect(
          await verifyVaultHasMigrated({ wsRoot, vault: vaults[0] })
        ).toBeTruthy();
      });

      test("THEN the logoPath is updated to account for the moved asset", async () => {
        const ws = ExtensionProvider.getDWorkspace();
        const { wsRoot } = ws;
        const config = await ws.config;
        const logoPath = ConfigUtils.getPublishing(config).logoPath;
        expect(logoPath).toBeTruthy();
        // If the logoPath was not updated, then we won't find the asset file there
        expect(
          await fs.pathExists(path.join(wsRoot, path.normalize(logoPath!)))
        ).toBeTruthy();
      });

      test("THEN the git folders/files are handled correctly", async () => {
        const ws = ExtensionProvider.getDWorkspace();
        const { wsRoot } = ws;
        const vaults = await ws.vaults;
        expect(
          await fs.pathExists(
            path.join(pathForVaultRoot({ vault: vaults[0], wsRoot }), ".git")
          )
        ).toBeTruthy();
        expect(
          await fs.pathExists(
            path.join(
              pathForVaultRoot({ vault: vaults[0], wsRoot }),
              ".gitignore"
            )
          )
        ).toBeTruthy();
      });
    }
  );

  describeSingleWS(
    "WHEN there's a workspace vault",
    {
      selfContained: false,
      postSetupHook: async ({ wsRoot, vaults }) => {
        const vaultPath = pathForVaultRoot({ wsRoot, vault: vaults[0] });
        // Turn the regular vault inside the workspace into a workspace vault
        await WorkspaceService.createWorkspace({
          useSelfContainedVault: false,
          wsRoot: vaultPath,
          wsVault: {
            fsPath: "inner",
          },
        });
        const wsService = new WorkspaceService({
          wsRoot: vaultPath,
        });
        await wsService.createVault({
          addToCodeWorkspace: true,
          vault: {
            fsPath: "vault",
          },
        });
      },
    },
    () => {
      let reloadWindow: SinonStubbedFn<typeof VSCodeUtils["reloadWindow"]>;
      let showQuickPick: SinonStubbedFn<typeof VSCodeUtils["showQuickPick"]>;

      before(async () => {
        const vaults = await ExtensionProvider.getDWorkspace().vaults;
        const cmd = new MigrateSelfContainedVaultCommand(
          ExtensionProvider.getExtension()
        );

        reloadWindow = sinon.stub(VSCodeUtils, "reloadWindow");
        showQuickPick = stubMigrateQuickPick(VaultUtils.getName(vaults[0]));

        await cmd.run();
      });
      after(() => {
        [reloadWindow, showQuickPick].forEach((stub) => stub.restore());
      });

      test("THEN it prompts for the vault and confirmation", () => {
        expect(showQuickPick.callCount).toEqual(2);
      });

      test("THEN the workspace reloads to apply the migration", () => {
        expect(reloadWindow.called).toBeTruthy();
      });

      test("THEN the vault is migrated", async () => {
        const ws = ExtensionProvider.getDWorkspace();
        const { wsRoot } = ws;
        const vaults = await ws.vaults;
        expect(
          await verifyVaultHasMigrated({ wsRoot, vault: vaults[0] })
        ).toBeTruthy();
      });
    }
  );

  describeMultiWS(
    "WHEN there are multiple vaults",
    { selfContained: false },
    () => {
      let reloadWindow: SinonStubbedFn<typeof VSCodeUtils["reloadWindow"]>;
      let showQuickPick: SinonStubbedFn<typeof VSCodeUtils["showQuickPick"]>;

      before(async () => {
        const vaults = await ExtensionProvider.getDWorkspace().vaults;
        const cmd = new MigrateSelfContainedVaultCommand(
          ExtensionProvider.getExtension()
        );

        reloadWindow = sinon.stub(VSCodeUtils, "reloadWindow");
        showQuickPick = stubMigrateQuickPick(VaultUtils.getName(vaults[0]));

        await cmd.run();
      });
      after(() => {
        [reloadWindow, showQuickPick].forEach((stub) => stub.restore());
      });

      test("THEN it prompts for the vault and confirmation", () => {
        expect(showQuickPick.callCount).toEqual(2);
      });

      test("THEN the workspace reloads to apply the migration", () => {
        expect(reloadWindow.called).toBeTruthy();
      });

      test("THEN the vault is migrated", async () => {
        const ws = ExtensionProvider.getDWorkspace();
        const { wsRoot } = ws;
        const vaults = await ws.vaults;
        expect(
          await verifyVaultHasMigrated({ wsRoot, vault: vaults[0] })
        ).toBeTruthy();
      });
    }
  );
});

async function verifyVaultNotMigrated({
  wsRoot,
  vault,
}: {
  wsRoot: string;
  vault: DVault;
}) {
  const vaultFolder = path.join(wsRoot, vault.fsPath);
  // No config files inside the vault
  expect(
    await fs.pathExists(path.join(vaultFolder, CONSTANTS.DENDRON_CONFIG_FILE))
  ).toBeFalsy();
  expect(
    await fs.pathExists(path.join(vaultFolder, CONSTANTS.DENDRON_WS_NAME))
  ).toBeFalsy();
  // No notes folder
  const notesFolder = path.join(vaultFolder, FOLDERS.NOTES);
  expect(await fs.pathExists(notesFolder)).toBeFalsy();
  // and the vault should NOT be marked as self contained in the config
  const config = (
    await ConfigService.instance().readRaw(URI.file(wsRoot))
  )._unsafeUnwrap() as DendronConfig;
  const newVault = ConfigUtils.getVaults(config).find(
    (newVault) => newVault.fsPath === vault.fsPath
  );
  expect(newVault?.selfContained).toBeFalsy();

  return true;
}

async function verifyVaultHasMigrated({
  wsRoot,
  vault,
}: {
  wsRoot: string;
  vault: DVault;
}) {
  const vaultFolder = path.join(wsRoot, vault.fsPath);
  expect(await fs.pathExists(vaultFolder)).toBeTruthy();
  // If it is migrated, then it should have config files inside it
  expect(
    await fs.pathExists(path.join(vaultFolder, CONSTANTS.DENDRON_CONFIG_FILE))
  ).toBeTruthy();
  expect(
    await fs.pathExists(path.join(vaultFolder, CONSTANTS.DENDRON_WS_NAME))
  ).toBeTruthy();
  // If it is migrated, the notes should be inside `notes` now
  const notesFolder = path.join(vaultFolder, FOLDERS.NOTES);
  expect(await fs.pathExists(notesFolder)).toBeTruthy();
  expect(await fs.pathExists(path.join(notesFolder, "root.md"))).toBeTruthy();
  expect(
    await fs.pathExists(path.join(notesFolder, "root.schema.yml"))
  ).toBeTruthy();
  // and there should be no notes outside the notes folder
  expect(await fs.pathExists(path.join(vaultFolder, "root.md"))).toBeFalsy();
  // and the vault should be marked as self contained in the config
  const config = (
    await ConfigService.instance().readRaw(URI.file(wsRoot))
  )._unsafeUnwrap() as DendronConfig;
  const newVault = ConfigUtils.getVaults(config).find(
    (newVault) => newVault.fsPath === vault.fsPath
  );
  expect(newVault?.selfContained).toBeTruthy();
  return true;
}
