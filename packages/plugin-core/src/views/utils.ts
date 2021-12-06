import {
  DendronTreeViewKey,
  DendronWebViewKey,
  DMessageEnum,
  DUtils,
  getStage,
  NoteProps,
  OnDidChangeActiveTextEditorMsg,
} from "@dendronhq/common-all";
import _ from "lodash";
import { title } from "process";
import * as vscode from "vscode";
import { Logger } from "../logger";
import { getExtension, getDWorkspace } from "../workspace";
import path from "path";
import { findUpTo, WebViewCommonUtils } from "@dendronhq/common-server";
import { VSCodeUtils } from "../vsCodeUtils";
import { WSUtils } from "../WSUtils";

export class WebViewUtils {
  /**
   * Get root uri where web view assets are store
   * When running in development, this is in the build folder of `dendron-plugin-views`
   * @returns
   */
  static getViewRootUri() {
    const assetUri = VSCodeUtils.getAssetUri(getExtension().context);
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
   *
   */
  static getWebviewContent({
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
    const root = VSCodeUtils.getAssetUri(getExtension().context);
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
      port,
      wsRoot,
      browser: false,
      acquireVsCodeApi: `const vscode = acquireVsCodeApi(); window.vscode = vscode;`,
      themeMap,
    });
    return out;
  }

  static genHTMLForView = async ({
    title,
    view,
  }: {
    title: string;
    view: DendronTreeViewKey | DendronWebViewKey;
  }) => {
    const { wsRoot, config } = getDWorkspace();
    const ext = getExtension();
    const port = getExtension().port;
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
    view: DendronWebViewKey;
  }) => {
    /**
     * Implementation might differ in the future
     */
    return WebViewUtils.genHTMLForView({ title, view });
  };
}

/**
 * Utils assisting with the preview
 */
export class PreviewUtils {
  static onDidChangeHandler(document: vscode.TextDocument) {
    const maybeNote = WSUtils.tryGetNoteFromDocument(document);
    if (!_.isUndefined(maybeNote)) PreviewUtils.refresh(maybeNote);
  }

  static refresh(note: NoteProps) {
    const ctx = { ctx: "ShowPreview:refresh", fname: note.fname };
    const panel = getExtension().getWebView(DendronWebViewKey.NOTE_PREVIEW);
    Logger.debug({ ...ctx, state: "enter" });
    if (panel) {
      Logger.debug({ ...ctx, state: "panel found" });
      panel.title = `${title} ${note.fname}`;
      panel.webview.postMessage({
        type: DMessageEnum.ON_DID_CHANGE_ACTIVE_TEXT_EDITOR,
        data: {
          note,
          syncChangedNote: true,
        },
        source: "vscode",
      } as OnDidChangeActiveTextEditorMsg);
    }
  }
}
