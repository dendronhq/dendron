import path from "path";
import { ConfigUtils } from ".";
import { DendronConfig, DendronSiteFM, NoteProps, SEOProps } from "../types";

export class PublishUtils {
  static getPublishFM(note: NoteProps): DendronSiteFM {
    if (!note.custom) {
      return {};
    }
    return note.custom as DendronSiteFM;
  }
  static getSEOPropsFromConfig(config: DendronConfig): Partial<SEOProps> {
    const { title, twitter, description, image } =
      ConfigUtils.getPublishing(config).seo;
    return { title, twitter, description, image };
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
  static hasCustomSiteBanner(config: DendronConfig): boolean {
    return ConfigUtils.getPublishing(config).siteBanner === "custom";
  }
}
