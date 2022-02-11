import {
  DendronSiteConfig,
  DendronPublishingConfig,
  IntermediateDendronConfig,
  NoteProps,
  PublishUtils,
  SEOProps,
  Time,
  ConfigUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import { NextSeo, NextSeoProps } from "next-seo";
import { useDendronRouter } from "../utils/hooks";
import { getRootUrl } from "../utils/links";

const getCanonicalUrl = ({
  sitePath,
  seoProps,
  siteConfig,
}: {
  sitePath: string;
  seoProps: SEOProps;
  siteConfig: DendronSiteConfig | DendronPublishingConfig;
}): string => {
  // check for note specific overrides
  if (seoProps.canonicalBaseUrl) {
    return [siteConfig.siteUrl, sitePath].join("");
  }
  if (seoProps.canonicalUrl) {
    return seoProps.canonicalUrl;
  }

  // apply canonical base
  const base = siteConfig.canonicalBaseUrl
    ? siteConfig.canonicalBaseUrl
    : getRootUrl(siteConfig);
  // home page, no suffix
  return [base, sitePath].join("");
};

// Export so we can test
export const unix2SEOTime = (ts: number) =>
  Time.DateTime.fromMillis(_.toInteger(ts))
    .setZone("utc")
    // @ts-ignore
    .toLocaleString("yyyy-LL-dd");

export default function DendronSEO({
  note,
  config,
}: {
  note: NoteProps;
  config: IntermediateDendronConfig;
}) {
  const dendronRouter = useDendronRouter();
  const path = dendronRouter.router.asPath;

  // don't generate for following pages
  if (
    _.some(["403"], (ent) => {
      return path === `/notes/${ent}/`;
    })
  ) {
    return null;
  }

  const siteSeoProps = PublishUtils.getSEOPropsFromConfig(config);
  const noteSeoProps = PublishUtils.getSEOPropsFromNote(note);
  const cleanSeoProps: SEOProps = _.defaults(noteSeoProps, siteSeoProps);

  const title = cleanSeoProps.title;
  const description = cleanSeoProps.excerpt;
  const images = cleanSeoProps?.image ? [cleanSeoProps.image] : [];
  const publishingConfig = ConfigUtils.getPublishingConfig(config);
  const canonical = getCanonicalUrl({
    sitePath: path,
    seoProps: cleanSeoProps,
    siteConfig: publishingConfig,
  });
  const maybeTwitter: NextSeoProps["twitter"] = cleanSeoProps.twitter
    ? {
        handle: cleanSeoProps.twitter,
        site: cleanSeoProps.twitter,
        cardType: "summary_large_image",
      }
    : undefined;
  const getTags = (note: NoteProps): string[] => {
    if (note.tags) {
      if (Array.isArray(note.tags)) {
        return note.tags;
      } else {
        return [note.tags];
      }
    } else {
      return [];
    }
  };
  return (
    <NextSeo
      title={title}
      description={description}
      canonical={canonical}
      noindex={cleanSeoProps.noindex}
      twitter={maybeTwitter}
      openGraph={{
        title,
        description,
        url: canonical,
        images,
        type: `article`,
        article: {
          publishedTime: unix2SEOTime(cleanSeoProps.created),
          modifiedTime: unix2SEOTime(cleanSeoProps.updated),
          tags: getTags(note),
        },
      }}
    />
  );
}
