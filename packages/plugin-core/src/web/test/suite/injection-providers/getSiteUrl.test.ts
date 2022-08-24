import assert from "assert";
import { getSiteUrl } from "../../../injection-providers/getSiteUrl";
import { WorkspaceHelpers } from "../../helpers/WorkspaceHelpers";

suite("GIVEN a workspace folder", () => {
  test("WHEN siteUrl is present in dendron.yml THEN return correct value", async () => {
    const wsRoot = await WorkspaceHelpers.getWSRootForTest();

    const config = {
      publishing: {
        siteUrl: "https://foo.com",
      },
    };

    await WorkspaceHelpers.createTestYAMLConfigFile(wsRoot, config);
    const siteUrl = await getSiteUrl(wsRoot);

    assert.strictEqual(siteUrl, "https://foo.com");
  });
  test("WHEN siteUrl is not present in dendron.yml THEN return empty value", async () => {
    const wsRoot = await WorkspaceHelpers.getWSRootForTest();

    const config = {
      publishing: {},
    };

    await WorkspaceHelpers.createTestYAMLConfigFile(wsRoot, config);
    const siteUrl = await getSiteUrl(wsRoot);

    assert.strictEqual(siteUrl, "");
  });
});
