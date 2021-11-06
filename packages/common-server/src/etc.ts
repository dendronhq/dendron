import fs from "fs-extra";
import path from "path";
import { goUpTo } from "./filesv2";
import {URI} from "@dendronhq/common-all"

export class NodeJSUtils {
  static getVersionFromPkg(): string {
    const pkgJSON = fs.readJSONSync(
      path.join(
        goUpTo({ base: __dirname, fname: "package.json" }),
        "package.json"
      )
    );
    return `${pkgJSON.version}`;
  }
}

export class WebViewCommonUtils {
  static genVSCodeHTMLIndex = ({
    cssSrc,
    jsSrc,
    port,
    wsRoot,
    browser,
    theme,
    acquireVsCodeApi,
  }: {
    cssSrc: URI;
    jsSrc: URI;
    port: number;
    wsRoot: string;
    browser: boolean;
    theme: string;
    acquireVsCodeApi: string
  }) => {
    return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#000000" />
      <meta
        name="description"
        content="Web site created using create-react-app"
      />
      <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
      <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
      <title>Dendron </title>
      <!-- add main style here -->
      <link href="${cssSrc}" rel="stylesheet" />

    </head>
    <body>
      <noscript>You need to enable JavaScript to run this app.</noscript>
      <div id="root" data-port="${port}" data-ws="${wsRoot}" data-browser="${browser}" data-theme="${theme}"></div>

      <script>
        <!-- This is a shim in browser mode -->
        ${acquireVsCodeApi}
      </script>

      <!-- Source code for javascript bundle. Not used in browser mode-->
      <script src="${jsSrc}"></script>
    </body>
  </html>`;
  };
}
