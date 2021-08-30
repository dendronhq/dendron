import {
  NoteUtils,
  Time,
  NoteSEOProps,
  DendronSiteConfig,
} from "@dendronhq/common-all";
import { verifyEngineSliceState } from "@dendronhq/common-frontend";
import _ from "lodash";
import { NextSeo } from "next-seo";
import { useEngineAppSelector } from "../features/engine/hooks";
import { useDendronRouter, useNoteActive } from "../utils/hooks";

const getCanonicalUrl = ({
  sitePath,
  seoProps,
  siteConfig,
}: {
  sitePath: string;
  seoProps: NoteSEOProps;
  siteConfig: DendronSiteConfig;
}): string => {
  if (seoProps.canonicalBaseUrl) {
    return [siteConfig.siteUrl, sitePath].join("");
  }
  if (seoProps.canonicalUrl) {
    return seoProps.canonicalUrl;
  }
  const base = siteConfig.canonicalBaseUrl
    ? siteConfig.canonicalBaseUrl
    : siteConfig.siteUrl;
  // home page, no suffix
  const suffix = sitePath === "/" ? "" : ".html";
  return [base, sitePath, suffix].join("");
};

export default function DendronSEO() {
  const dendronRouter = useDendronRouter();
  const engine = useEngineAppSelector((state) => state.engine);
  const { noteActive } = useNoteActive(dendronRouter.getActiveNoteId());
  if (!noteActive) {
    return null;
  }
  if (!verifyEngineSliceState(engine)) {
    return null;
  }
  const { config } = engine;
  const seoProps = NoteUtils.getSEOProps(noteActive);
  const title = seoProps.title;
  const description = seoProps.excerpt || config.site.description;
  const path = dendronRouter.router.asPath;
  const canonical = getCanonicalUrl({
    sitePath: path,
    seoProps,
    siteConfig: config.site,
  });
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
