import React from "react";

function canAccessIframe(iframe: HTMLIFrameElement) {
  try {
    return Boolean(iframe.contentWindow?.document);
  } catch (e) {
    return false;
  }
}

const updateIFrameHeight = () => {
  const iframes = document.querySelectorAll("iframe");
  iframes.forEach((iframe) => {
    if (iframe && canAccessIframe(iframe)) {
      const height = iframe!.contentWindow!.document.body.offsetHeight;
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
