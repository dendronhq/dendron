import { tmpDir } from "@dendronhq/common-server";
import { Git } from "@dendronhq/engine-server";
// import fs from "fs-extra";
// import path from "path";

describe("isRepo", async () => {
  test("no repo", async () => {
    const root = tmpDir().name;
    const repo = await Git.getRepo(root);
    expect(repo).toMatchSnapshot();
    expect(repo).toBeFalsy();
  });

  // test("repo", async () => {
  //   const root = tmpDir().name;
  //   const repo = await nodegit.Repository.init(root, 0);
  //   const newFilePath = path.join(root, "bond.md");
  //   fs.writeFileSync(newFilePath, "hello", { encoding: "utf8" });
  //   const idx = await repo.refreshIndex();
  //   await idx.addAll();
  //   await idx.write();
  //   const oid = await idx.writeTree();
  //   const author = nodegit.Signature.now("dendron", "bot@dendron.so");
  //   var committer = nodegit.Signature.now("dendron", "bot@dendron.so");
  //   const commitId = await repo.createCommit(
  //     "HEAD",
  //     author,
  //     committer,
  //     "message",
  //     oid,
  //     []
  //   );
  //   expect(commitId).toMatchSnapshot();
  //   expect(await isRepo(root)).toBeTruthy();
  // });
});
