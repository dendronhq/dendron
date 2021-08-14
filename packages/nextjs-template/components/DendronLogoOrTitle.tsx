import React from "react";
import { useEngineAppSelector } from "../features/engine/hooks";
import path from "path";

export default function DendronLogoOrTitle() {
  const engine = useEngineAppSelector((state) => state.engine);
  const title = engine.config?.site.title || "No title set";
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
        width: "20%",
        height: "100%",
        backgroundImage: `url(${logoUrl})`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "left center",
        backgroundSize: "contain",
        maxHeight: "2rem",
        marginLeft: 0,
        marginRight: "0.5rem",
      }}
    />
  );
}

export function Title({ data }: { data: string }) {
  return <>{data}</>;
}
