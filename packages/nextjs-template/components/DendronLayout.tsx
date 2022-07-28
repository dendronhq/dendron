import * as React from "react";
import DendronSideBar from "./layout/DendronSidebar";
import Script from "next/script";
import { ConfigUtils } from "@dendronhq/common-all";
import { DendronCommonProps } from "../utils/types";
import { DendronContent } from "./layout/DendronContent";
import { DendronHeader } from "./layout/DendronHeader";
import { Layout } from "antd";
import { useEngineAppSelector } from "../features/engine/hooks";

export default function DendronLayout(
  props: React.PropsWithChildren<DendronCommonProps>
) {
  const engine = useEngineAppSelector((state) => state.engine);
  const config = engine.config;
  const enableMermaid = config && ConfigUtils.getEnableMermaid(config, true);

  return (
    <Layout
      style={{
        width: "100%",
        minHeight: "100%",
      }}
    >
      {enableMermaid && (
        <Script
          id="initmermaid"
          src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"
          onLoad={() => {
            const mermaid = (window as any).mermaid;
            // save for debugging
            // when trying to access mermaid in DOM, <div id="mermaid"></div> gets returned
            // we disambiguate by saving a copy of mermaid
            (window as any)._mermaid = mermaid;

            mermaid.initialize({
              startOnLoad: false,
            });
            // initialize
            mermaid.init();
          }}
          strategy="lazyOnload"
        />
      )}
      <DendronHeader {...props} />
      <Layout
        style={{
          marginTop: 64,
          display: "flex",
          flexDirection: "row",
        }}
      >
        <DendronSideBar {...props} />
        <DendronContent {...props} />
      </Layout>
    </Layout>
  );
}
