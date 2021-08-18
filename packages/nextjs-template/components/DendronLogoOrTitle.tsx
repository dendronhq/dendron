import { getStage } from "@dendronhq/common-all";
import { verifyEngineSliceState } from "@dendronhq/common-frontend";
import path from "path";
import React from "react";
import { useEngineAppSelector } from "../features/engine/hooks";
import { DENDRON_STYLE_CONSTANTS } from "../styles/constants";

export default function DendronLogoOrTitle() {
  const engine = useEngineAppSelector((state) => state.engine);
  if (!verifyEngineSliceState(engine)) {
    return null;
  }
  const title = engine.config.site.title || "";
  const siteUrl =
    getStage() === "dev" ? "/" : engine.config.site.siteUrl || "/";
  return (
    <a
      href={siteUrl}
      style={{ display: "inline-block" }}
      className="site-title"
    >
      {engine.config?.site.logo ? (
        <Logo logoUrl={"/" + path.basename(engine.config?.site.logo)} />
      ) : (
        <Title data={title} />
      )}
    </a>
  );
}

export function Logo({ logoUrl }: { logoUrl: string }) {
  return (
    <div
      className="site-logo"
      style={{
        width: "60px",
        height: "60px",
        left: DENDRON_STYLE_CONSTANTS.SIDER.PADDING.LEFT,
        top: "2px",
        backgroundImage: `url(${logoUrl})`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "left center",
        backgroundSize: "contain",
      }}
    />
  );
}

export function Title({ data }: { data: string }) {
  return <div className="site-logo">{data}</div>;
}
