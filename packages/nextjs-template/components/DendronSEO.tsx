import {
  DendronConfig,
  DendronSiteConfig,
  NoteProps,
  SEOProps,
  NoteUtils,
  Time,
  PublishUtils,
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
  siteConfig: DendronSiteConfig;
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

export default function DendronSEO({
  note,
  config,
}: {
  note: NoteProps;
  config: DendronConfig;
}) {
  const dendronRouter = useDendronRouter();
  const path = dendronRouter.router.asPath;

  // don't generate for following pages
  if (
    _.some(["403", "changelog"], (ent) => {
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
  const canonical = getCanonicalUrl({
    sitePath: path,
    seoProps: cleanSeoProps,
    siteConfig: config.site,
  });
  // @ts-ignore
  const unix2SEOTime = (ts: number) =>
    Time.DateTime.fromMillis(_.toInteger(ts))
      .setZone("utc")
      // @ts-ignore
      .toLocaleString("yyyy-LL-dd");
  const maybeTwitter: NextSeoProps["twitter"] = cleanSeoProps.twitter
    ? {
        handle: cleanSeoProps.twitter,
        site: cleanSeoProps.twitter,
        cardType: "summary_large_image",
      }
    : undefined;
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
      }}
    />
  );
}
