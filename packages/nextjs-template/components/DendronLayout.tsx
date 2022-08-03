import * as React from "react";
import DendronSideBar from "./layout/DendronSidebar";
import Script from "next/script";
import { ConfigUtils } from "@dendronhq/common-all";
import { DendronCommonProps } from "../utils/types";
import { DendronContent } from "./layout/DendronContent";
import { DendronHeader } from "./layout/DendronHeader";
import { Layout } from "antd";
import { useEngineAppSelector } from "../features/engine/hooks";
import { useRouter } from "next/router";

export default function DendronLayout(
  props: React.PropsWithChildren<DendronCommonProps>
) {
  return (
    <Layout
      style={{
        width: "100%",
        minHeight: "100%",
      }}
    >
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
