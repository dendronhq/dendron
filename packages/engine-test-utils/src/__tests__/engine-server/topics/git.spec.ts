import { tmpDir } from "@dendronhq/common-server";
import { Git } from "@dendronhq/engine-server";
import { GitTestUtils } from "../../../utils";

describe("isRepo", async () => {
  test("no repo", async () => {
    const root = tmpDir().name;
    const repo = await Git.getRepo(root);
    expect(repo).toMatchSnapshot();
    expect(repo).toBeFalsy();
  });

  test("yes repo", async () => {
    const root = tmpDir().name;
    await GitTestUtils.createRepoWithReadme(root);
    const repo = await Git.getRepo(root);
    expect(repo).toMatchSnapshot();
    expect(repo).toBeTruthy();
  });
});
