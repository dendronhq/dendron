import { getStage } from "@dendronhq/common-all";
import { verifyEngineSliceState } from "@dendronhq/common-frontend";
import Link from "next/link";
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
    <Link href={siteUrl}>
      {/* eslint-disable-next-line jsx-a11y/anchor-is-valid -- `href` will be provided by `Link` */}
      <a
        style={{ display: "inline-block", height: "100%", padding: "4px" }}
        className="site-title"
      >
        {engine.config?.site.logo ? (
          <Logo logoUrl={"/" + path.basename(engine.config?.site.logo)} />
        ) : (
          <Title data={title} />
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
        width: "100%",
        height: "100%",
        verticalAlign: "top",
      }}
    />
  );
}

export function Title({ data }: { data: string }) {
  return <div className="site-logo">{data}</div>;
}
