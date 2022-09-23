import path from "path";
import { ConfigUtils } from ".";
import { DendronSiteFM, NoteProps, SEOProps } from "../types";
import { DendronSiteConfig } from "../types/configs/dendronConfigLegacy";
import {
  configIsV4,
  IntermediateDendronConfig,
} from "../types/intermediateConfigs";

export class PublishUtils {
  static getPublishFM(note: NoteProps): DendronSiteFM {
    if (!note.custom) {
      return {};
    }
    return note.custom as DendronSiteFM;
  }
  static getSEOPropsFromConfig(
    config: IntermediateDendronConfig
  ): Partial<SEOProps> {
    if (configIsV4(config)) {
      const { title, twitter, description, image } = ConfigUtils.getSite(
        config
      ) as DendronSiteConfig;
      return { title, twitter, description, image };
    } else {
      const { title, twitter, description, image } =
        ConfigUtils.getPublishing(config).seo;
      return { title, twitter, description, image };
    }
  }

  static getSEOPropsFromNote(note: NoteProps): SEOProps {
    const { title, created, updated, image, desc } = note;
    const { excerpt, canonicalUrl, noindex, canonicalBaseUrl, twitter } =
      note.custom ? note.custom : ({} as any);
    return {
      title,
      excerpt,
      description: excerpt || desc || undefined,
      updated,
      created,
      canonicalBaseUrl,
      canonicalUrl,
      noindex,
      image,
      twitter,
    };
  }

  /**
   * Path to the banner alert compoenent
   */
  static getCustomSiteBannerPathFromWorkspace(wsRoot: string) {
    return path.join(wsRoot, "publish", "components", "BannerAlert.tsx");
  }

  static getCustomSiteBannerPathToPublish(publishRoot: string) {
    return path.join(publishRoot, "custom", "BannerAlert.tsx");
  }

  /**
   * Site banner uses a custom react component
   */
  static hasCustomSiteBanner(config: IntermediateDendronConfig): boolean {
    return ConfigUtils.getPublishing(config).siteBanner === "custom";
  }
}
