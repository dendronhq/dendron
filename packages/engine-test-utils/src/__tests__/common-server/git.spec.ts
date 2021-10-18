import { ConfigUtils, RESERVED_KEYS, VaultUtils } from "@dendronhq/common-all";
import { GitUtils } from "@dendronhq/common-server";
import _ from "lodash";
import path from "path";
import { runEngineTestV5, testWithEngine } from "../../engine";
import { ENGINE_HOOKS } from "../../presets";

describe("GitUtils", () => {
  describe("getGithubEditUrl", () => {
    const gitUrl = "https://github.com/dendronhq/dendron-site";

    testWithEngine("basic", async ({ engine, wsRoot }) => {
      const config = ConfigUtils.genDefaultConfig();
      config.site.gh_edit_view_mode = "edit";
      config.site.gh_edit_branch = "main";
      config.site.gh_edit_repository = gitUrl;
      const note = engine.notes["foo"];
      expect(GitUtils.getGithubEditUrl({ note, config, wsRoot })).toEqual(
        "https://github.com/dendronhq/dendron-site/edit/main/vault1/foo.md"
      );
    });

    testWithEngine("vault override", async ({ engine, wsRoot }) => {
      const config = ConfigUtils.genDefaultConfig();
      config.site.gh_edit_view_mode = "edit";
      config.site.gh_edit_branch = "main";
      config.site.gh_edit_repository = gitUrl;
      const note = engine.notes["foo"];
      const vault = _.find(
        engine.vaults,
        (ent) => ent.fsPath === note.vault.fsPath
      )!;
      vault.remote = { url: "git@github.com:kevin/foo.git", type: "git" };
      config.vaults = engine.vaults;
      expect(GitUtils.getGithubEditUrl({ note, config, wsRoot })).toEqual(
        "https://github.com/kevin/foo/edit/main/foo.md"
      );
    });

    testWithEngine("note override", async ({ engine, wsRoot }) => {
      const config = ConfigUtils.genDefaultConfig();
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

  describe("getGithubFileUrl", () => {
    test("ok - unix separator", async () => {
      await runEngineTestV5(
        async ({ wsRoot, vaults }) => {
          const vaultURI = path.join(wsRoot, VaultUtils.getRelPath(vaults[0]));
          expect(
            await GitUtils.getGithubFileUrl(vaultURI, "foo.md", 1, 2)
          ).toEqual(
            "https://github.com/dendronhq/dendron-site/blob/master/foo.md#L2:L3"
          );
        },
        {
          expect,
          initGit: true,
          preSetupHook: ENGINE_HOOKS.setupBasic,
          git: {
            initVaultWithRemote: true,
            branchName: "master",
          },
        }
      );
    });

    test("ok - windows separtor", async () => {
      await runEngineTestV5(
        async ({ wsRoot, vaults }) => {
          const vaultURI = path.join(wsRoot, VaultUtils.getRelPath(vaults[0]));
          expect(
            await GitUtils.getGithubFileUrl(vaultURI, "\\foo.md", 1, 2)
          ).toEqual(
            "https://github.com/dendronhq/dendron-site/blob/master/foo.md#L2:L3"
          );
        },
        {
          expect,
          initGit: true,
          preSetupHook: ENGINE_HOOKS.setupBasic,
          git: {
            initVaultWithRemote: true,
            branchName: "master",
          },
        }
      );
    });
  });
});
