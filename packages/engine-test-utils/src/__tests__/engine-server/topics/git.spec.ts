import { tmpDir } from "@dendronhq/common-server";
import { Git } from "@dendronhq/engine-server";
import { GitTestUtils } from "../../../utils";
import fs from "fs-extra";
import path from "path";

describe("isRepo", () => {
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

  test("has no changes", async () => {
    const root = tmpDir().name;
    await GitTestUtils.createRepoWithReadme(root);
    const git = new Git({ localUrl: root });
    const changes = await git.hasChanges();
    expect(changes).toBeFalsy();
  });

  test("has changes", async () => {
    const root = tmpDir().name;
    await GitTestUtils.createRepoWithReadme(root);
    const git = new Git({ localUrl: root });
    fs.writeFileSync(path.join(root, "gamma.md"), "hello");
    const changes = await git.hasChanges();
    expect(changes).toBeTruthy();
  });
});
