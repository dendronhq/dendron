import Head from "next/head";
import * as React from "react";

/**
 * Header for {@link Note} componenet
 */
function PreviewHeader() {
  return (
    <Head>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.22.0/themes/prism.min.css"
      />
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/katex@0.12.0/dist/katex.min.css"
        integrity="sha384-AfEj0r4/OFrOo5t7NnNe46zW/tFgW6x/bCJG8FqQCEo3+Aro6EYUG4+cU+KJWu/X"
        crossOrigin="anonymous"
      />
      <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
      <script
        id="MathJax-script"
        async
        src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
      ></script>
    </Head>
  );
}

export default PreviewHeader;
