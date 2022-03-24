import {
  APIUtils,
  DendronEditorViewKey,
  DendronTreeViewKey,
  DUtils,
  getStage,
  getWebTreeViewEntry,
} from "@dendronhq/common-all";
import { findUpTo, WebViewCommonUtils } from "@dendronhq/common-server";
import path from "path";
import * as vscode from "vscode";
import { IDendronExtension } from "../dendronExtensionInterface";
import { ExtensionProvider } from "../ExtensionProvider";
import { Logger } from "../logger";
import { VSCodeUtils } from "../vsCodeUtils";

export class WebViewUtils {
  /**
   * Get root uri where web view assets are store
   * When running in development, this is in the build folder of `dendron-plugin-views`
   * @returns
   */
  static getViewRootUri() {
    const assetUri = VSCodeUtils.getAssetUri(
      ExtensionProvider.getExtension().context
    );
    const pkgRoot = path.dirname(
      findUpTo({ base: __dirname, fname: "package.json", maxLvl: 5 })!
    );
    return getStage() === "dev"
      ? vscode.Uri.file(
          path.join(pkgRoot, "..", "dendron-plugin-views", "build")
        )
      : assetUri;
  }

  static getJsAndCss(name: string) {
    const pluginViewsRoot = WebViewUtils.getViewRootUri();
    const jsSrc = vscode.Uri.joinPath(
      pluginViewsRoot,
      "static",
      "js",
      `${name}.bundle.js`
    );
    const cssSrc = vscode.Uri.joinPath(
      pluginViewsRoot,
      "static",
      "css",
      `${name}.styles.css`
    );
    return { jsSrc, cssSrc };
  }

  static getLocalResourceRoots(context: vscode.ExtensionContext) {
    const assetUri = VSCodeUtils.getAssetUri(context);
    const pluginViewsRoot = WebViewUtils.getViewRootUri();
    return [assetUri, pluginViewsRoot];
  }

  /**
   *
   * @param panel: required to convert asset URLs to VSCode Webview Extension format
   * @returns
   */
  static async getWebviewContent({
    jsSrc,
    cssSrc,
    port,
    wsRoot,
    panel,
  }: {
    jsSrc: vscode.Uri;
    cssSrc: vscode.Uri;
    port: number;
    wsRoot: string;
    panel: vscode.WebviewPanel | vscode.WebviewView;
  }) {
    const root = VSCodeUtils.getAssetUri(
      ExtensionProvider.getExtension().context
    );
    const themes = ["light", "dark"];
    const themeMap: any = {};
    themes.map((th) => {
      themeMap[th] = panel.webview
        .asWebviewUri(
          vscode.Uri.joinPath(root, "static", "css", "themes", `${th}.css`)
        )
        .toString();
    });
    const out = WebViewCommonUtils.genVSCodeHTMLIndex({
      jsSrc: panel.webview.asWebviewUri(jsSrc).toString(),
      cssSrc: panel.webview.asWebviewUri(cssSrc).toString(),
      // Need to use `asExternalUri` to make sure port forwarding is set up
      // correctly in remote workspaces
      url: (
        await vscode.env.asExternalUri(
          vscode.Uri.parse(APIUtils.getLocalEndpoint(port))
        )
      )
        .toString()
        // Slice of trailing slash
        .slice(undefined, -1),
      wsRoot,
      browser: false,
      // acquireVsCodeApi() Documentation: This function can only be invoked once per session.
      // You must hang onto the instance of the VS Code API returned by this method,
      // and hand it out to any other functions that need to use it.
      acquireVsCodeApi: `const vscode = acquireVsCodeApi(); window.vscode = vscode;`,
      themeMap,
    });
    return out;
  }
  static async prepareTreeView({
    ext,
    key,
    webviewView,
  }: {
    ext: IDendronExtension;
    key: DendronTreeViewKey;
    webviewView: vscode.WebviewView;
  }) {
    const viewEntry = getWebTreeViewEntry(key);
    const name = viewEntry.bundleName;
    const webViewAssets = WebViewUtils.getJsAndCss(name);
    const port = ext.port!;
    webviewView.webview.options = {
      enableScripts: true,
      enableCommandUris: false,
      localResourceRoots: WebViewUtils.getLocalResourceRoots(ext.context),
    };
    const html = await WebViewUtils.getWebviewContent({
      ...webViewAssets,
      port,
      wsRoot: ext.getEngine().wsRoot,
      panel: webviewView,
    });
    webviewView.webview.html = html;
  }

  /**
   * @deprecated Use `{@link WebviewUtils.getWebviewContent}`
   * @param param0
   * @returns
   */
  static genHTMLForView = async ({
    title,
    view,
  }: {
    title: string;
    view: DendronTreeViewKey | DendronEditorViewKey;
  }) => {
    const { wsRoot, config } = ExtensionProvider.getDWorkspace();
    const ext = ExtensionProvider.getExtension();
    const port = ext.port;
    const qs = DUtils.querystring.stringify({
      ws: wsRoot,
      port,
    });

    // View is `dendron.{camelCase}`
    // we want to remove `dendron` and transform camelCase to snake case
    // In addition, if we are serving using a live nextjs server, don't append .html at the end
    const src = `${await ext.getClientAPIRootUrl()}vscode/${view.replace(
      /^dendron\./,
      ""
    )}${config.dev?.nextServerUrl ? "" : ".html"}?${qs}`;
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
  }: {
    title: string;
    view: DendronEditorViewKey;
  }) => {
    /**
     * Implementation might differ in the future
     */
    return WebViewUtils.genHTMLForView({ title, view });
  };
}
