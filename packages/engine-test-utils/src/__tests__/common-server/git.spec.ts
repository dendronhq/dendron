import { RESERVED_KEYS } from "@dendronhq/common-all";
import { GitUtils } from "@dendronhq/common-server";
import { DConfig } from "@dendronhq/engine-server";
import _ from "lodash";
import { testWithEngine } from "../../engine";

describe("GitUtils", () => {
  describe("getGithubEditUrl", () => {
    const gitUrl = "https://github.com/dendronhq/dendron-site";

    testWithEngine("basic", async ({ engine, wsRoot }) => {
      const config = DConfig.genDefaultConfig();
      config.site.gh_edit_view_mode = "edit";
      config.site.gh_edit_branch = "main";
      config.site.gh_edit_repository = gitUrl;
      const note = engine.notes["foo"];
      expect(GitUtils.getGithubEditUrl({ note, config, wsRoot })).toEqual(
        "https://github.com/dendronhq/dendron-site/edit/main/vault1/foo.md"
      );
    });

    testWithEngine("vault override", async ({ engine, wsRoot }) => {
      const config = DConfig.genDefaultConfig();
      config.site.gh_edit_view_mode = "edit";
      config.site.gh_edit_branch = "main";
      config.site.gh_edit_repository = gitUrl;
      const note = engine.notes["foo"];
      const vault = _.find(
        engine.vaultsv3,
        (ent) => ent.fsPath === note.vault.fsPath
      )!;
      vault.remote = { url: "git@github.com:kevin/foo.git", type: "git" };
      config.vaults = engine.vaultsv3;
      expect(GitUtils.getGithubEditUrl({ note, config, wsRoot })).toEqual(
        "https://github.com/kevin/foo/edit/main/foo.md"
      );
    });

    testWithEngine("note override", async ({ engine, wsRoot }) => {
      const config = DConfig.genDefaultConfig();
      config.site.gh_edit_view_mode = "edit";
      config.site.gh_edit_branch = "main";
      config.site.gh_edit_repository = gitUrl;
      const note = engine.notes["foo.ch1"];
      note.custom[RESERVED_KEYS.GIT_NOTE_PATH] = "{{ noteHiearchy }}.md";
      expect(GitUtils.getGithubEditUrl({ note, config, wsRoot })).toEqual(
        "https://github.com/dendronhq/dendron-site/edit/main/foo/ch1.md"
      );
    });
  });
});
