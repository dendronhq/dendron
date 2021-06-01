import {
  DendronTreeViewKey,
  DendronWebViewKey,
  DUtils,
} from "@dendronhq/common-all";
import { Logger } from "../logger";
import { DendronWorkspace, getWS } from "../workspace";

export class WebViewUtils {
  static genHTMLForView = ({
    title,
    view,
    query = {},
  }: {
    title: string;
    view: DendronTreeViewKey | DendronWebViewKey;
    query?: {
      [key: string]: string;
    };
  }) => {
    const ws = getWS();
    const qs = DUtils.querystring.stringify({
      ws: DendronWorkspace.wsRoot(),
      port: ws.port,
      ...query,
    });

    // View is `dendron.{camelCase}`
    // we want to remove `dendron` and transform camelCase to snake case
    // In addition, if we are serving using a live nextjs server, don't append .html at the end
    const src = `${ws.getClientAPIRootUrl()}/vscode/${view.replace(
      /^dendron\./,
      ""
    )}${ws.config.dev?.nextServerUrl ? "" : ".html"}?${qs}`;
    Logger.info({ ctx: "genHTML", view, src });
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    html, body, iframe { 
      margin: 0; 
      padding: 0; 
      border: 0; 
      height: 100vh; 
      width: 100vw; 
      overflow: hidden;
    }
  </style>
</head>
<body>
  <iframe id="iframeView" src="${src}"></iframe>

  <script>
    function main() {
      const vscode = acquireVsCodeApi();
  
      function postMsg(msg) {
        const iframe = document.getElementById('iframeView');
        iframe.contentWindow.postMessage(msg, "*");
      };
  
      function getTheme() {
          // get theme
          let vsTheme = document.body.className;
          let dendronTheme;
          if (vsTheme.endsWith("dark")) {
              dendronTheme = "dark";
          } else {
              dendronTheme = "light";
          }
          return {vsTheme, dendronTheme};
      }
  
      window.addEventListener("message", (e) => {
        console.log("got message", e);
        const message = e.data;
        if (message.type && message.source === "webClient") {
            // check if we need a theme
            if (message.type === "init") {
              console.log("initilizing client");
              postMsg({
                  type: "onThemeChange",
                  source: "vscode",
                  data: {
                      theme: getTheme().dendronTheme
                  }
              });
              // get active editor from vscode
              vscode.postMessage({
                  type: "onGetActiveEditor",
                  source: "webClient",
                  data: {}
              });
            } else {
              console.log("got webclient event", message)
              vscode.postMessage(message);
            }
            return;
        } else if (message.source === 'vscode') {
          console.log("got message from vscode", message);
          postMsg(message);
        } else  {
          console.log("got keyboard event", e.data);
          window.dispatchEvent(new KeyboardEvent('keydown', JSON.parse(e.data)));
        }
      }, false);
  }
    console.log("initialized webview");
    main();

  </script>

</body>

</html>`;
  };

  static genHTMLForTreeView = ({
    title,
    view,
  }: {
    title: string;
    view: DendronTreeViewKey;
  }) => {
    return WebViewUtils.genHTMLForView({ title, view });
  };

  static genHTMLForWebView = ({
    title,
    view,
    query,
  }: {
    title: string;
    view: DendronWebViewKey;
    query?: {
      [key: string]: string;
    };
  }) => {
    /**
     * Implementation might differ in the future
     */
    return WebViewUtils.genHTMLForView({ title, view, query });
  };
}
