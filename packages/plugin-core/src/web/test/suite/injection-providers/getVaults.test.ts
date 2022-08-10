import assert from "assert";
import { getVaults } from "../../../injection-providers/getVaults";
import { WorkspaceHelpers } from "../../helpers/WorkspaceHelpers";

suite("GIVEN a workspace folder", () => {
  test("WHEN there's a single legacy (non self-contained) vault THEN the vault is returned correctly", async () => {
    const wsRoot = await WorkspaceHelpers.getWSRootForTest();

    const config = {
      workspace: {
        vaults: [
          {
            fsPath: "test",
            name: "test-name",
          },
        ],
      },
    };

    await WorkspaceHelpers.createTestYAMLConfigFile(wsRoot, config);
    const vaults = await getVaults(wsRoot);

    assert.strictEqual(vaults.length, 1);
    assert(vaults[0].fsPath.endsWith("test"));
    assert(!vaults[0].selfContained);
    assert.strictEqual(vaults[0].name, "test-name");
  });

  test("WHEN there's a single self-contained vault THEN the vault is returned correctly", async () => {
    const wsRoot = await WorkspaceHelpers.getWSRootForTest();

    const config = {
      workspace: {
        vaults: [
          {
            fsPath: "test",
            selfContained: true,
          },
        ],
      },
    };

    await WorkspaceHelpers.createTestYAMLConfigFile(wsRoot, config);
    const vaults = await getVaults(wsRoot);

    assert.strictEqual(vaults.length, 1);
    assert(vaults[0].fsPath.endsWith("test"));
    assert(vaults[0].selfContained);
  });

  test("WHEN there are multiple vaults THEN all vaults are returned correctly", async () => {
    const wsRoot = await WorkspaceHelpers.getWSRootForTest();

    const config = {
      workspace: {
        vaults: [
          {
            fsPath: "test",
            selfContained: true,
          },
          {
            fsPath: "legacy",
          },
        ],
      },
    };

    await WorkspaceHelpers.createTestYAMLConfigFile(wsRoot, config);
    const vaults = await getVaults(wsRoot);

    assert.strictEqual(vaults.length, 2);
    assert(vaults[0].fsPath.endsWith("test"));
    assert(vaults[0].selfContained);

    assert(vaults[1].fsPath.endsWith("legacy"));
    assert(!vaults[1].selfContained);
  });
});
