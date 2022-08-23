import Head from "next/head";
import { useEffect } from "react";
import { useIFrameHeightAdjuster } from "../hooks/useIFrameHeightAdjuster";

interface IDendronRefProps {
  body: string;
}

interface Window {
  testingVariable: any;
}

export function DendronRef(props: IDendronRefProps) {
  useIFrameHeightAdjuster();
  const { body } = props;

  return (
    <div>
      <Head>
        <base target="_top" />
      </Head>
      {/* eslint-disable-next-line react/no-danger */}
      <div dangerouslySetInnerHTML={{ __html: body }} />
    </div>
  );
}
