import { tmpDir } from "@dendronhq/common-server";
import { Git } from "@dendronhq/engine-server";
import { GitTestUtils } from "../../../utils";
import fs from "fs-extra";
import path from "path";
import { testWithEngine } from "../../../engine";

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

describe("GIVEN a remotely tracked repo", () => {
  describe("getRemote", () => {
    testWithEngine(
      "THEN getRemote correctly returns remote",
      async ({ wsRoot }) => {
        const remoteDir = tmpDir().name;
        await GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
        const git = new Git({ localUrl: wsRoot });
        const out = await git.getRemote();
        expect(out).toEqual("origin");
      }
    );
  });
  describe("getRemoteUrl", () => {
    testWithEngine(
      "THEN getRemoteUrl correctly returns remote url",
      async ({ wsRoot }) => {
        const remoteDir = tmpDir().name;
        await GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
        const git = new Git({ localUrl: wsRoot });
        const out = await git.getRemoteUrl();
        expect(out).toEqual(remoteDir);
      }
    );
  });
});

describe("GIVEN no repo", () => {
  describe("getRemote", () => {
    testWithEngine(
      "THEN getRemote correctly returns undefined",
      async ({ wsRoot }) => {
        const git = new Git({ localUrl: wsRoot });
        const out = await git.getRemote();
        expect(out).toEqual(undefined);
      }
    );
  });
  describe("getRemoteUrl", () => {
    testWithEngine(
      "THEN getRemoteUrl correctly returns undefined",
      async ({ wsRoot }) => {
        const git = new Git({ localUrl: wsRoot });
        const out = await git.getRemoteUrl();
        expect(out).toEqual(undefined);
      }
    );
  });
});
