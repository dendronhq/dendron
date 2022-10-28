import {
  GitUtils,
  ConfigUtils,
  NoteUtils,
  DVault,
  GithubEditViewModeEnum,
} from "@dendronhq/common-all";

const fname = "foo";
const vault: DVault = {
  name: "fooVault",
  fsPath: "fooVault",
};

describe("GIVEN GitUtils", () => {
  describe(`WHEN config is default`, () => {
    const config = ConfigUtils.genDefaultConfig();
    const note = NoteUtils.create({
      vault,
      fname,
    });

    test("THEN `canShowGitLink` should be false", () => {
      expect(GitUtils.canShowGitLink({ config, note })).toBeFalsy();
    });

    test("THEN `getGithubEditUrl` should return github edit url", () => {
      expect(GitUtils.getGithubEditUrl({ config, note })).toEqual(
        "/tree/main/fooVault/foo.md"
      );
    });
  });
  describe("WHEN config contains github properties", () => {
    const config = ConfigUtils.genDefaultConfig();

    config.publishing.github = {
      enableEditLink: true,
      editLinkText: "Edit this page on Github",
      editRepository: "https://github.com/kevinslin/dendron-11ty-test",
      editBranch: "main",
      editViewMode: GithubEditViewModeEnum.edit,
    };

    const note = NoteUtils.create({
      vault,
      fname,
    });

    test("THEN `canShowGitLink` should be true", () => {
      expect(GitUtils.canShowGitLink({ config, note })).toBeTruthy();
    });

    test("THEN `getGithubEditUrl` should return github edit url", () => {
      expect(GitUtils.getGithubEditUrl({ config, note })).toEqual(
        "https://github.com/kevinslin/dendron-11ty-test/edit/main/fooVault/foo.md"
      );
    });

    describe("AND note contains `gitNoLink` property", () => {
      const note = NoteUtils.create({
        custom: { gitNoLink: true },
        vault,
        fname,
      });

      test("THEN canShowGitLink should be false", () => {
        expect(GitUtils.canShowGitLink({ config, note })).toBeFalsy();
      });
    });
  });

  test("THEN `git2Github` conversion", () => {
    expect(
      GitUtils.git2Github("git@github.com:kevinslin/dendron-vault.git")
    ).toEqual("https://github.com/kevinslin/dendron-vault");
  });

  test("THEN `getGithubAccessTokenUrl` conversion", () => {
    expect(
      GitUtils.getGithubAccessTokenUrl({
        remotePath: "https://github.com/kevinslin/dendron-11ty-test",
        accessToken: "abc",
      })
    ).toEqual(
      "https://abc:x-oauth-basic@github.com/kevinslin/dendron-11ty-test"
    );
  });
});
