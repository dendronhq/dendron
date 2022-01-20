import { ConfigUtils, PublishUtils } from "@dendronhq/common-all";
import { verifyEngineSliceState } from "@dendronhq/common-frontend";
import { Col } from "antd";
import Link from "next/link";
import path from "path";
import React from "react";
import { useEngineAppSelector } from "../features/engine/hooks";
import { DENDRON_STYLE_CONSTANTS } from "../styles/constants";
import { getRootUrl } from "../utils/links";

export default function DendronLogoOrTitle() {
  const engine = useEngineAppSelector((state) => state.engine);
  if (!verifyEngineSliceState(engine)) {
    return null;
  }
  const { title } = PublishUtils.getSEOPropsFromConfig(engine.config);
  const logoUrl = ConfigUtils.getSiteLogoUrl(engine.config) || "";
  const publishingConfig = ConfigUtils.getPublishingConfig(engine.config);

  return (
    <Link href={getRootUrl(publishingConfig)}>
      {/* eslint-disable-next-line jsx-a11y/anchor-is-valid -- `href` will be provided by `Link` */}
      <a
        style={{
          display: "inline-block",
          height: DENDRON_STYLE_CONSTANTS.HEADER.HEIGHT,
          padding: "4px",
          width: "100%",
        }}
        className="site-title"
      >
        {engine.config?.site.logo ? (
          <Logo logoUrl={logoUrl} />
        ) : (
          <Title data={title || ""} />
        )}
      </a>
    </Link>
  );
}

export function Logo({ logoUrl }: { logoUrl: string }) {
  return (
    <img
      src={logoUrl}
      className="site-logo"
      alt="logo"
      style={{
        objectFit: "contain",
        height: "100%",
        verticalAlign: "top",
      }}
    />
  );
}

export function Title({ data }: { data: string }) {
  return (
    <div
      className="site-title"
      title={data}
      style={{
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {data}
    </div>
  );
}
