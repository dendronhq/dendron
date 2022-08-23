import React from "react";

export function useIFrameHeightAdjuster() {
  React.useEffect(() => {
    setTimeout(() => {
      // check even if there iframes before running this code
      const depth = getFrameDepth(window.self);
      console.log(depth);
      let timeoutTime = 2000;
      // maximum of 3 deep
      timeoutTime *= 3 - depth;
      console.log(`${depth} : ${timeoutTime}`);

      setTimeout(() => {
        // fix height of all iframes...
        const iframes = document.querySelectorAll("iframe");
        iframes.forEach((iframe, i) => {
          if (iframe) {
            // 24 for the margin on the reference...
            const height =
              iframe!.contentWindow!.document.body.offsetHeight + 36;
            console.log(
              `At Depth ${depth}, changing iframe ${i} to be ${height}`
            );
            iframe.style.height = `${height}px`;
          }
        });
      }, timeoutTime);
      function getFrameDepth(winToID: any): number {
        if (winToID === window.top) {
          return 0;
        } else if (winToID.parent === window.top) {
          return 1;
        }

        return 1 + getFrameDepth(winToID.parent);
      }
    }, 2000);
  }, []);

  return;
}
