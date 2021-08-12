import { NoteUtils, Time } from "@dendronhq/common-all";
import { verifyEngineSliceState } from "@dendronhq/common-frontend";
import _ from "lodash";
import { NextSeo } from "next-seo";
import { useEngineAppSelector } from "../features/engine/hooks";
import { useDendronRouter } from "../utils/hooks";

export default function DendronSEO() {
  const dendronRouter = useDendronRouter();
  const engine = useEngineAppSelector((state) => state.engine);
  if (!verifyEngineSliceState(engine)) {
    return null;
  }
	const {config, notes} = engine;
  const maybeActiveNote = dendronRouter.getActiveNote({ notes });
  if (!maybeActiveNote) {
    return null;
  }
  const seoProps = NoteUtils.getSEOProps(maybeActiveNote);
  const title = seoProps.title;
  const description = seoProps.excerpt;
  const path =  dendronRouter.router.asPath;
  const canonical = seoProps.canonicalUrl || [config.site.siteUrl, path].join("");
	// @ts-ignore
	const unix2SEOTime = (ts: number) => Time.DateTime.fromMillis(_.toInteger(ts)).setZone("utc").toLocaleString('yyyy-LL-dd');
  return (
    <NextSeo
      title={title}
      description={description}
      canonical={canonical}
			defaultTitle={config.site.title}
			noindex={seoProps.noindex}
			additionalMetaTags={[{
				property: 'dc:creator',
				content: 'Jane Doe'
			}, {
				name: 'application-name',
				content: 'NextSeo'
			}, {
				httpEquiv: 'x-ua-compatible',
				content: 'IE=edge; chrome=1'
			}]}
      openGraph={{
        title,
        description,
        url: canonical,
        images: [
        ],
      }}
    />
  );
}
