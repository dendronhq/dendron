import React from "react";

const updateIFrameHeight = () => {
  const iframes = document.querySelectorAll("iframe");
  iframes.forEach((iframe, i) => {
    if (iframe) {
      // 24 for the margin on the reference...
      const height = iframe!.contentWindow!.document.body.offsetHeight + 36;
      iframe.style.height = `${height}px`;
    }
  });
  if (window.self !== window.top) {
    if (window.parent.updateIFrameHeights) {
      window.parent.updateIFrameHeights();
    }
  }
};

export function useIFrameHeightAdjuster() {
  React.useEffect(() => {
    if (!window.updateIFrameHeights) {
      window.updateIFrameHeights = updateIFrameHeight;
      updateIFrameHeight();
    } else {
      updateIFrameHeight();
    }
  }, []);

  return;
}
