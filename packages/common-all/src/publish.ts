import { DendronSiteConfig, DendronSiteFM, NoteProps, SEOProps } from "./types";
import {
  configIsV4,
  IntermediateDendronConfig,
} from "./types/intermediateConfigs";
import { ConfigUtils } from "./utils";

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
      const {
        title,
        twitter,
        description: excerpt,
        image,
      } = ConfigUtils.getSite(config) as DendronSiteConfig;
      return { title, twitter, excerpt, image };
    } else {
      const {
        title,
        twitter,
        description: excerpt,
        image,
      } = ConfigUtils.getPublishing(config).seo;
      return { title, twitter, excerpt, image };
    }
  }

  static getSEOPropsFromNote(note: NoteProps): SEOProps {
    const { title, created, updated, image } = note;
    const { excerpt, canonicalUrl, noindex, canonicalBaseUrl, twitter } =
      note.custom ? note.custom : ({} as any);
    return {
      title,
      excerpt,
      updated,
      created,
      canonicalBaseUrl,
      canonicalUrl,
      noindex,
      image,
      twitter,
    };
  }
}
