import Head from "next/head";
import { useEffect } from "react";
import { useIFrameHeightAdjuster } from "../hooks/useIFrameHeightAdjusterr";

interface IDendronRefProps {
  body: string;
  noteUrl: string;
  noteTitle: string;
}

interface Window {
  testingVariable: any;
}

export function DendronRef(props: IDendronRefProps) {
  const { body, noteUrl, noteTitle } = props;
  useIFrameHeightAdjuster();
  return (
    <div className="ref-container">
      <Head>
        <base target="_top" />
      </Head>
      <div className="portal-container">
        <div className="portal-head">
          <div className="portal-backlink">
            <div className="portal-title">
              From <span className="portal-text-title">{noteTitle}</span>
            </div>
            {/** Make a proper Link? */}
            <a href={noteUrl} className="portal-arrow">
              Go to text <span className="right-arrow">→</span>
            </a>
          </div>
        </div>
        <div id="portal-parent-anchor" className="portal-parent">
          <div className="portal-parent-fader-top" />
          <div className="portal-parent-fader-bottom" />
        </div>
        {/* eslint-disable-next-line react/no-danger */}
        <div dangerouslySetInnerHTML={{ __html: body }} />
      </div>
    </div>
  );
}
