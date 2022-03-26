import fs from "fs-extra";
import path from "path";
import { goUpTo } from "./filesv2";

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
  /**
   *
   * @param param0
   * @returns
   */
  static genVSCodeHTMLIndex = ({
    jsSrc,
    cssSrc,
    url,
    wsRoot,
    browser,
    acquireVsCodeApi,
    themeMap,
    initialTheme,
  }: {
    jsSrc: string;
    cssSrc: string;
    url: string;
    wsRoot: string;
    browser: boolean;
    acquireVsCodeApi: string;
    themeMap: {
      light: string;
      dark: string;
    };
    initialTheme?: string;
  }) => {
    return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta
        name="description"
        content="Web site created using create-react-app"
      />
      <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
      <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
      <link rel="stylesheet" href="${cssSrc}" />
      <title>Dendron </title>

    </head>

    <script type="text/javascript">
      var theme = 'unknown';

      function onload() {
        applyTheme(document.body.className);

        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutationRecord) {
                applyTheme(mutationRecord.target.className);
            });
        });
        var target = document.body;
        observer.observe(target, { attributes : true, attributeFilter : ['class'] });
      }

      function applyTheme(newTheme) {
        var prefix = 'vscode-';
        if (newTheme.startsWith(prefix)) {
            // strip prefix
            newTheme = newTheme.substr(prefix.length);
        }

        if (newTheme === 'high-contrast') {
            newTheme = 'dark'; // the high-contrast theme seems to be an extreme case of the dark theme
        }
        // be bale to get current theme using JS;
        window.currentTheme = newTheme;

        if (theme === newTheme) return;
        theme = newTheme;

        console.log('Applying theme: ' + newTheme);

        var themeMap = ${JSON.stringify(themeMap)};

        // Dynamically add css
        var link = document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('href', themeMap[newTheme]);
        document.head.appendChild(link);
      }
      ${acquireVsCodeApi}
    </script>

    <!-- Javascript to handle copy event: to take the html of the copy without taking the theming. -->
    <script type="text/javascript">
      document.addEventListener('copy', (e) => {
        const htmlSelection = getHTMLOfSelection();

        if (htmlSelection !== undefined){
          copyToClipboard(htmlSelection);
        }
      });
     /**
       * Decodes a HTML Encoded string
       * @see https://stackoverflow.com/a/34064434
       * @param {string} input The HTML Encoded String to be decoded
       * @returns string
       */
      function htmlDecode(input) {
          var doc = new DOMParser().parseFromString(input, "text/html");
          return doc.documentElement.textContent;
      }
      /**
       *
       * Cleans a HTML String from Style and script tags as well as additional Linebreaks
       * @see https://stackoverflow.com/questions/822452/strip-html-from-text-javascript
       * @param {string} text the HTML string to clean
       * @returns  string
       */
      function clean(text) {
          const out = text
              .replace(/<style[^>]*>.*<\\/style> /gm, "")
              // Remove script tags and content
              .replace(/<script[^>]*>.*<\\/script > /gm, "")
              // Remove all opening, closing and orphan HTML tags
              .replace(/<[^>]+>/gm, "")
              // Remove leading spaces and repeated CR/LF
              .replace(/([\\r\\n]+ +)+/gm, " ");
          return out;
      }

      /**
       * Gets the HTML String of an Selection
       * @see https://stackoverflow.com/a/5084044/7858768
       * @returns  string
       */
      function getHTMLOfSelection() {
          let range;
          if (document.selection && document.selection.createRange) {
              range = document.selection.createRange();
              return range.htmlText;
          }
          else if (window.getSelection) {
              const selection = window.getSelection();
              if (selection.rangeCount > 0) {
                  range = selection.getRangeAt(0);
                  const clonedSelection = range.cloneContents();
                  const div = document.createElement('div');
                  div.appendChild(clonedSelection);
                  return div.innerHTML;
              }
              else {
                  return undefined;
              }
          }
          else {
              return undefined;
          }
      }

      /**
        * Copys the provided string to the System Clipboard while cleaning and html decoding it.
        * @see https://stackoverflow.com/a/64711198/7858768
        * @see https://stackoverflow.com/a/57279336/7858768
        * @param {string} html the text to copy to the Clipboard
        * @return void
        */
      function copyToClipboard(html) {
          const container = document.createElement('div');
          container.innerHTML = html;
          container.style.position = 'fixed';
          container.style.pointerEvents = 'none';
          container.style.opacity = 0;

          const blob = new Blob([html], { type: "text/html" });
          const blobPlain = new Blob([htmlDecode(clean(html))], { type: "text/plain" });
          const item = new ClipboardItem({
              "text/html": blob,
              "text/plain": blobPlain,
          });
          navigator.clipboard.write([item]).then(function () {

          }, function (error) {
              console.error("Unable to write to clipboard. Error:");
              console.log(error);
          });
        }
    </script>

    <body onload="onload()" class="vscode-${initialTheme || "light"}">
      <div id="main-content-wrap" class="main-content-wrap">
        <div id="main-content" class="main-content">
          <div id="root" data-url="${url}" data-ws="${wsRoot}" data-browser="${browser}"></div>
        </div>
      </div>

      <!-- Source code for javascript bundle. Not used in browser mode-->
      <script src="${jsSrc}"></script>
    </body>
  </html>`;
  };
}
