import {
  DendronConfig,
  DendronSiteConfig,
  NoteProps,
  NoteSEOProps,
  NoteUtils,
  Time,
} from "@dendronhq/common-all";
import _ from "lodash";
import { NextSeo } from "next-seo";
import { useDendronRouter } from "../utils/hooks";
import { getRootUrl } from "../utils/links";

const getCanonicalUrl = ({
  sitePath,
  seoProps,
  siteConfig,
}: {
  sitePath: string;
  seoProps: NoteSEOProps;
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

  const seoProps = NoteUtils.getSEOProps(note);
  const title = seoProps.title;
  const description = seoProps.excerpt || config.site.description;
  const canonical = getCanonicalUrl({
    sitePath: path,
    seoProps,
    siteConfig: config.site,
  });

  console.log("BOND canonical", canonical);
  // @ts-ignore
  const unix2SEOTime = (ts: number) =>
    Time.DateTime.fromMillis(_.toInteger(ts))
      .setZone("utc")
      // @ts-ignore
      .toLocaleString("yyyy-LL-dd");
  return (
    <NextSeo
      title={title}
      description={description}
      canonical={canonical}
      defaultTitle={config.site.title}
      noindex={seoProps.noindex}
      additionalMetaTags={[
        {
          property: "dc:creator",
          content: "Jane Doe",
        },
        {
          name: "application-name",
          content: "NextSeo",
        },
        {
          httpEquiv: "x-ua-compatible",
          content: "IE=edge; chrome=1",
        },
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1.0",
        },
      ]}
      openGraph={{
        title,
        description,
        url: canonical,
        images: [],
      }}
    />
  );
}
