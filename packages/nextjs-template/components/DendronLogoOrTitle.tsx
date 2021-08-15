import React from "react";
import { useEngineAppSelector } from "../features/engine/hooks";
import path from "path";
import { DENDRON_STYLE_CONSTANTS } from "../styles/constants";

export default function DendronLogoOrTitle() {
  const engine = useEngineAppSelector((state) => state.engine);
  const title = engine.config?.site.title || "";
  if (engine.config?.site.logo) {
    const logoUrl = "/" + path.basename(engine.config?.site.logo);
    return <Logo logoUrl={logoUrl} />;
  }
  return <Title data={title} />;
}

export function Logo({ logoUrl }: { logoUrl: string }) {
  return (
    <div
      className="site-logo"
      style={{
        width: "60px",
        height: "60px",
        position: "fixed",
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
  return (
    <div
      className="site-logo"
      style={{
        width: "60px",
        height: "60px",
        position: "fixed",
        left: DENDRON_STYLE_CONSTANTS.SIDER.PADDING.LEFT,
        top: "2px",
      }}
    >
      {data}
    </div>
  );
}
