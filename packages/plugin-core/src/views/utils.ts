import {
  APIUtils,
  CONSTANTS,
  DendronEditorViewKey,
  DendronError,
  DendronTreeViewKey,
  DUtils,
  getStage,
  getWebTreeViewEntry,
} from "@dendronhq/common-all";
import {
  findUpTo,
  getDurationMilliseconds,
  WebViewCommonUtils,
  WebViewThemeMap,
} from "@dendronhq/common-server";
import path from "path";
import * as vscode from "vscode";
import { IDendronExtension } from "../dendronExtensionInterface";
import { ExtensionProvider } from "../ExtensionProvider";
import { Logger } from "../logger";
import { VSCodeUtils } from "../vsCodeUtils";
import fs from "fs-extra";

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
    const pkgRoot = findUpTo({
      base: __dirname,
      fname: "package.json",
      maxLvl: 5,
      returnDirPath: true,
    });
    if (!pkgRoot) {
      throw new DendronError({
        message: "Unable to find the folder where Dendron assets are stored",
      });
    }
    return getStage() === "dev"
      ? vscode.Uri.file(
          path.join(pkgRoot, "..", "dendron-plugin-views", "build")
        )
      : assetUri;
  }

  static getJsAndCss() {
    const pluginViewsRoot = WebViewUtils.getViewRootUri();
    const jsSrc = vscode.Uri.joinPath(
      pluginViewsRoot,
      "static",
      "js",
      `index.bundle.js`
    );
    const cssSrc = vscode.Uri.joinPath(
      pluginViewsRoot,
      "static",
      "css",
      `index.styles.css`
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
    name,
    jsSrc,
    cssSrc,
    port,
    wsRoot,
    panel,
    initialTheme,
  }: {
    name: string;
    jsSrc: vscode.Uri;
    cssSrc: vscode.Uri;
    port: number;
    wsRoot: string;
    panel: vscode.WebviewPanel | vscode.WebviewView;
    initialTheme?: string;
  }) {
    const root = VSCodeUtils.getAssetUri(
      ExtensionProvider.getExtension().context
    );
    const themes = ["light", "dark"];
    const themeMap: { [key: string]: string } = {};

    const customThemePath = path.join(wsRoot, CONSTANTS.CUSTOM_THEME_CSS);
    if (await fs.pathExists(customThemePath)) {
      themeMap["custom"] = panel.webview
        .asWebviewUri(vscode.Uri.file(customThemePath))
        .toString();
    }

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
      themeMap: themeMap as WebViewThemeMap,
      initialTheme,
      name,
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
    const webViewAssets = WebViewUtils.getJsAndCss();
    const port = ext.port!;
    webviewView.webview.options = {
      enableScripts: true,
      enableCommandUris: false,
      localResourceRoots: WebViewUtils.getLocalResourceRoots(ext.context),
    };
    const html = await WebViewUtils.getWebviewContent({
      ...webViewAssets,
      name,
      port,
      wsRoot: ext.getEngine().wsRoot,
      panel: webviewView,
    });
    webviewView.webview.html = html;
  }

  /**
   * @deprecated Use `{@link WebViewUtils.getWebviewContent}`
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
    const ws = ExtensionProvider.getDWorkspace();
    const { wsRoot } = ws;
    const config = await ws.config;
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
          
          var reduceMotionClassName = "vscode-reduce-motion"
          if(vsTheme.includes(reduceMotionClassName)) {
            vsTheme = vsTheme.replace(reduceMotionClassName,"").trim()
          }

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

  /** Opens the given panel, and measures how long it stays open.
   *
   * Call this function **before** you open the panel with `panel.reveal()`.
   * This function will open the panel for you.
   *
   * @param panel The panel, must not have been opened yet.
   * @param onClose A callback that will run once the webview is closed. The duration given is in milliseconds.
   */
  static openWebviewAndMeasureTimeOpen(
    panel: vscode.WebviewPanel,
    onClose: (duration: number) => void
  ) {
    let visibleTimeTotal = 0;
    // We don't get an initial view state change event, so we have to start the timer now
    let visibleStart: [number, number] | undefined = process.hrtime();

    panel.onDidChangeViewState((event) => {
      if (event.webviewPanel.visible) {
        // When the user switches back into the view, we start measuring
        visibleStart = process.hrtime();
      } else {
        // When the user switches away from the view, we stop measuring
        if (visibleStart)
          visibleTimeTotal += getDurationMilliseconds(visibleStart);
        visibleStart = undefined;
      }
    });

    panel.onDidDispose(() => {
      // If the user closes the webview while it's open, the view state change
      // event is skipped and it immediately calls the dispose event.
      if (visibleStart)
        visibleTimeTotal += getDurationMilliseconds(visibleStart);

      onClose(visibleTimeTotal);
    });
  }
}
