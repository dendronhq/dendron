import { tmpDir } from "@dendronhq/common-server";
import { Git } from "@dendronhq/engine-server";

describe("isRepo", async () => {
  test("no repo", async () => {
    const root = tmpDir().name;
    const repo = await Git.getRepo(root);
    expect(repo).toMatchSnapshot();
    expect(repo).toBeFalsy();
  });
});
