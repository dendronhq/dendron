import { ConfigUtils, DendronConfig } from "@dendronhq/common-all";
import type { DeepPartial } from "@reduxjs/toolkit";

function getConfig(override?: DeepPartial<DendronConfig>): DendronConfig {
  const config = ConfigUtils.genDefaultConfig();
  return { ...config, ...override } as DendronConfig;
}

describe("ConfigUtils", () => {
  describe("GIVEN findDifference", () => {
    describe("WHEN config has no difference", () => {
      test("THEN correctly outputs no change", () => {
        const config = getConfig();
        const output = ConfigUtils.findDifference({ config });
        expect(output.length).toEqual(0);
      });
    });
    describe("WHEN changed config is given", () => {
      test("THEN correctly output list of changes", () => {
        const config = getConfig({
          commands: {
            lookup: {
              note: {
                selectionMode: "link",
                leaveTrace: true,
              },
            },
          },
          workspace: {
            journal: {
              dailyDomain: "dailys",
            },
            task: {
              taskCompleteStatus: ["x", "finished"],
            },
          },
        });
        const output = ConfigUtils.findDifference({ config });
        expect(output.length).toEqual(4);
        expect(output).toEqual([
          {
            path: "commands.lookup.note.selectionMode",
            value: "link",
          },
          {
            path: "commands.lookup.note.leaveTrace",
            value: true,
          },
          {
            path: "workspace.journal.dailyDomain",
            value: "dailys",
          },
          {
            path: "workspace.task.taskCompleteStatus",
            value: JSON.stringify(["x", "finished"]),
          },
        ]);
      });
    });
    describe("WHEN config with changes only in omitted paths is given", () => {
      test("THEN return empty list", () => {
        const config = ConfigUtils.genDefaultConfig();
        config.workspace.vaults = [
          {
            fsPath: "some.vault",
            name: "some vault",
          },
          {
            fsPath: "some.vault2",
            name: "some vault2",
          },
          {
            fsPath: "some.vault3",
            name: "some vault3",
          },
        ];
        config.workspace.workspaces = {
          foo: {
            remote: {
              type: "git",
              url: "foo",
            },
          },
        };
        config.workspace.seeds = {
          "dendron.dendron-site": {
            branch: "dev",
            site: {
              url: "https://wiki.dendron.son",
              index: "dendron",
            },
          },
        };
        config.dev = {
          enableSelfContainedVaults: false,
        };
        const output = ConfigUtils.findDifference({ config });
        expect(output.length).toEqual(0);
      });
    });
  });
  describe("GIVEN getSiteLogoUrl", () => {
    describe("WHEN logo is not defined", () => {
      test("THEN logo is undefined", () => {
        const config = getConfig();
        const siteUrl = ConfigUtils.getSiteLogoUrl(config);
        expect(siteUrl).toBeUndefined();
      });
    });

    describe("WHEN logo is a URL", () => {
      test("THEN logo is returned identically.", () => {
        const logoPath = "https://example.com/image.png";
        const config = getConfig({
          publishing: { logoPath },
        });
        const siteUrl = ConfigUtils.getSiteLogoUrl(config);
        expect(siteUrl).toEqual(logoPath);
      });
    });

    describe("WHEN logo is an asset", () => {
      describe("AND assetsPrefix is undefined", () => {
        test("THEN logo is a path to the asset", () => {
          const config = getConfig({
            publishing: { logoPath: "vault/assets/images/logo.png" },
          });
          const siteUrl = ConfigUtils.getSiteLogoUrl(config);
          expect(siteUrl).toEqual("/assets/logo.png");
        });
      });

      describe("AND assetsPrefix is defined", () => {
        test("THEN logo respects the prefix", () => {
          const config = getConfig({
            publishing: {
              logoPath: "vault/assets/images/logo.png",
              assetsPrefix: "/site",
            },
          });
          const siteUrl = ConfigUtils.getSiteLogoUrl(config);
          expect(siteUrl).toEqual("/site/assets/logo.png");
        });
      });
    });
  });
});
