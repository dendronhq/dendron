import React, { useEffect } from "react";
import Script from "next/script";
import { createLogger } from "@dendronhq/common-frontend";

interface MermaidScriptProps {
  noteBody: string;
}

export const MermaidScript: React.FC<MermaidScriptProps> = (props) => {
  const [loadMermaid, setLoadMermaid] = React.useState(false);
  const { noteBody } = props;

  useEffect(() => {
    const isMermaidOnWindow = window.mermaid !== undefined;
    if (isMermaidOnWindow) {
      return;
    }
    // semi expensive?
    const noteHasMermaid = noteBody.includes('class="mermaid"');
    if (noteHasMermaid) {
      setLoadMermaid(true);
    }
  }, [noteBody]);

  if (loadMermaid) {
    const logger = createLogger("MermaidScript");
    logger.info({ ctx: "loading mermaid" });
    return (
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
      />
    );
  }
  return <></>;
};
