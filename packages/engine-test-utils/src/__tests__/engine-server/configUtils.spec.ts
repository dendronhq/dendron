import { ConfigUtils, IntermediateDendronConfig } from "@dendronhq/common-all";
import type { DeepPartial } from "@reduxjs/toolkit";

function getConfig(
  override?: DeepPartial<IntermediateDendronConfig>
): IntermediateDendronConfig {
  const config = ConfigUtils.genDefaultConfig();
  return { ...config, ...override } as IntermediateDendronConfig;
}

describe("ConfigUtils", () => {
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
