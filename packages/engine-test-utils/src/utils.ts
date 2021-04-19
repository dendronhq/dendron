import { AssertUtils } from "@dendronhq/common-test-utils";
import { Git } from "@dendronhq/engine-server";
import fs from "fs-extra";
import path from "path";

export async function checkString(body: string, ...match: string[]) {
  expect(
    await AssertUtils.assertInString({
      body,
      match,
    })
  ).toBeTruthy();
}

export async function checkNotInString(body: string, ...nomatch: string[]) {
  expect(
    await AssertUtils.assertInString({
      body,
      nomatch,
    })
  ).toBeTruthy();
}

export class GitTestUtils {
  static async createRepoForWorkspace(wsRoot: string) {
    const git = new Git({ localUrl: wsRoot });
    await git.init();
    await git.add("dendron.yml");
    await git.commit({ msg: "init" });
  }
  static async createRepoWithReadme(root: string) {
    const git = new Git({ localUrl: root });
    await git.init();
    const readmePath = path.join(root, "README.md");
    fs.ensureFileSync(readmePath);
    await git.add(".");
    await git.commit({ msg: "init" });
  }
}
