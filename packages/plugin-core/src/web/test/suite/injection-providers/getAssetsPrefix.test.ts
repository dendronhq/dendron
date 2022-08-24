import assert from "assert";
import { getAssetsPrefix } from "../../../injection-providers/getAssetsPrefix";
import { WorkspaceHelpers } from "../../helpers/WorkspaceHelpers";

suite("GIVEN a workspace folder", () => {
  test("WHEN assetsPrefix is present in dendron.yml THEN return correct value", async () => {
    const wsRoot = await WorkspaceHelpers.getWSRootForTest();

    const config = {
      publishing: {
        assetsPrefix: "/testing-workspace",
      },
    };

    await WorkspaceHelpers.createTestYAMLConfigFile(wsRoot, config);
    const assetsPrefix = await getAssetsPrefix(wsRoot);

    assert.strictEqual(assetsPrefix, "/testing-workspace");
  });
  test("WHEN assetsPrefix is not present in dendron.yml THEN return empty value", async () => {
    const wsRoot = await WorkspaceHelpers.getWSRootForTest();

    const config = {
      publishing: {},
    };

    await WorkspaceHelpers.createTestYAMLConfigFile(wsRoot, config);
    const assetsPrefix = await getAssetsPrefix(wsRoot);

    assert.strictEqual(assetsPrefix, "");
  });
});
