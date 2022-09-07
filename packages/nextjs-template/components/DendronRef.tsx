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

const MAX_REFERENCE_DEPTH = 3;

export function DendronRef(props: IDendronRefProps) {
  useIFrameHeightAdjuster();
  const { body, noteUrl, noteTitle } = props;
  let renderBody = true;
  if (typeof window !== "undefined") {
    const frameDepth = getFrameDepth(window.self);
    if (frameDepth > MAX_REFERENCE_DEPTH) {
      renderBody = false;
    }
  }

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
        {renderBody ? (
          <div dangerouslySetInnerHTML={{ __html: body }} />
        ) : (
          <p>
            (note not rendered, references can only render up to{" "}
            {MAX_REFERENCE_DEPTH} level deep.)
          </p>
        )}
      </div>
    </div>
  );
}

/** Useful function for debugging */
/** Called with window.self, get the depth of the window.  0 is top */
function getFrameDepth(windowDotSelf: any): number {
  if (windowDotSelf === window.top) {
    return 0;
  } else if (windowDotSelf.parent === window.top) {
    return 1;
  }

  return 1 + getFrameDepth(windowDotSelf.parent);
}
