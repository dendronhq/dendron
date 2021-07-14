import Head from "next/head";
import * as React from "react";
import { DendronProps } from "../lib/types";
import { createLogger } from "@dendronhq/common-frontend";

export function MermaidHeaders() {
  return [
    <script
      key="mermaid-js"
      src="/js/mermaid.8-11.min.js"
    ></script>,
  ];
}

export function MathJaxHeaders() {
  return [
    <link
      key="math-style"
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/katex@0.12.0/dist/katex.min.css"
      integrity="sha384-AfEj0r4/OFrOo5t7NnNe46zW/tFgW6x/bCJG8FqQCEo3+Aro6EYUG4+cU+KJWu/X"
      crossOrigin="anonymous"
    />,
    <script
      key="math-style-2"
      src="https://polyfill.io/v3/polyfill.min.js?features=es6"
    ></script>,
    <script
      key="math-script"
      id="MathJax-script"
      async
      src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
    ></script>,
  ];
}

/**
 * Header for {@link Note} componenet
 */
function PreviewHeader({ engine }: DendronProps) {
  const ctx = "PreviewHeader";
  const logger = createLogger("PreviewHeader");
  logger.info({ ctx, config: engine?.config });

  return (
    <Head>
      <script
        key="jquery"
        src="/js/jquery.3-60.min.js"
      ></script>
      {engine?.config?.useKatex && MathJaxHeaders()}
      {engine?.config?.mermaid && MermaidHeaders()}
    </Head>
  );
}

export default PreviewHeader;
