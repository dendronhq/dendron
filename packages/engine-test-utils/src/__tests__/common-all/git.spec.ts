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

describe(`GIVEN GitUtils`, () => {
  describe(`WHEN config is default`, () => {
    const config = ConfigUtils.genDefaultConfig();
    const note = NoteUtils.create({
      vault,
      fname,
    });

    test(`THEN canShowGitLink should be false`, () => {
      expect(GitUtils.canShowGitLink({ config, note })).toBeFalsy();
    });
  });
  describe(`WHEN config contains github properties`, () => {
    const config = ConfigUtils.genDefaultConfig();

    config.publishing.github = {
      enableEditLink: true,
      editLinkText: "Edit this page on Github",
      editRepository: "https://github.com/kevinslin/dendron-11ty-test",
      editBranch: "main",
      editViewMode: GithubEditViewModeEnum.edit,
    };

    test(`THEN canShowGitLink should be true`, () => {
      const note = NoteUtils.create({
        vault,
        fname,
      });
      expect(GitUtils.canShowGitLink({ config, note })).toBeTruthy();
    });

    describe("AND note contains `gitNoLink` property", () => {
      const note = NoteUtils.create({
        custom: { gitNoLink: true },
        vault,
        fname,
      });

      test(`THEN canShowGitLink should be false`, () => {
        expect(GitUtils.canShowGitLink({ config, note })).toBeFalsy();
      });
    });
  });
});
