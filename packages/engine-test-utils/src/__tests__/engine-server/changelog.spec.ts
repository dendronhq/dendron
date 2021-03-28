import {
  ChangelogGenerator,
  generateChangelog,
} from "@dendronhq/engine-server";
import fs from "fs-extra";
import { testWithEngine } from "../../engine";
import { checkString, GitTestUtils } from "../../utils";

describe("genChangelog", async () => {
  testWithEngine("basic", async ({ engine, wsRoot }) => {
    await GitTestUtils.createRepoWithReadme(wsRoot);
    await generateChangelog(engine);
    const fpath = ChangelogGenerator.getChangelogDataPath(wsRoot);
    const data = fs.readFileSync(fpath, { encoding: "utf8" });
    await checkString(data, "vault1/foo.ch1.md");
  });
});
