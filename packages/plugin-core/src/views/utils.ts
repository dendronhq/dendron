import { DMessageSource, DUtils } from "@dendronhq/common-all";
import { DendronViewKey } from "../constants";
import { Logger } from "../logger";
import { DendronWorkspace, getWS } from "../workspace";

export class WebViewUtils {
  static genHTML = ({
    title,
    view,
  }: {
    title: string;
    view: DendronViewKey;
  }) => {
    const ws = getWS();
    const qs = DUtils.querystring.stringify({
      ws: DendronWorkspace.wsRoot(),
      port: ws.port,
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
    const vscode = acquireVsCodeApi();

    window.addEventListener("message", (e) => {
      console.log("got message", e);
      const message = e.data;
      if (message.type && message.source === '${DMessageSource.webClient}') {
        console.log("got webclient event", message)
        vscode.postMessage(message);
        return;
      } else if (message.source === 'vscode') {
        console.log("got message from vscode", message)
        const iframe = document.getElementById('iframeView');
        iframe.contentWindow.postMessage(message, "*");
      } else  {
        window.dispatchEvent(new KeyboardEvent('keydown', JSON.parse(e.data)));
      }
    }, false);
  </script>

</body>

</html>`;
  };
}
