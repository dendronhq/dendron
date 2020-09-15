import { DendronSiteConfig } from "@dendronhq/common-all";
import _ from "lodash";

export function setupDendronPubConfig(opts: {
  siteHierarchies?: string[];
  siteRootDir: string;
}) {
  const { siteHierarchies, siteRootDir } = _.defaults(opts, {
    siteHierarchies: ["root"],
  });
  const config: DendronSiteConfig = {
    siteHierarchies,
    siteRootDir,
  };
  return config;
}
