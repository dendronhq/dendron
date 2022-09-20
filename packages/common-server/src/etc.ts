import fs from "fs-extra";
import { findUpTo } from "./filesv2";

export class NodeJSUtils {
  static getVersionFromPkg(): string | undefined {
    const packageJsonPath = findUpTo({
      base: __dirname,
      fname: "package.json",
      maxLvl: 5,
    });
    if (!packageJsonPath) return undefined;
    try {
      const pkgJSON = fs.readJSONSync(packageJsonPath);
      if (!pkgJSON?.version) return undefined;
      return `${pkgJSON.version}`;
    } catch {
      // There may be errors if we couldn't read the file
      return undefined;
    }
  }
}

export type WebViewThemeMap = {
  dark: string;
  light: string;
  custom?: string;
};

export class WebViewCommonUtils {
  /**
   *
   * @param param0
   * @returns
   */
  static genVSCodeHTMLIndex = ({
    name,
    jsSrc,
    cssSrc,
    url,
    wsRoot,
    browser,
    acquireVsCodeApi,
    themeMap,
    initialTheme,
  }: {
    name: string;
    jsSrc: string;
    cssSrc: string;
    url: string;
    wsRoot: string;
    browser: boolean;
    acquireVsCodeApi: string;
    themeMap: WebViewThemeMap;
    initialTheme?: string;
  }) => {
    const builtinStyle = "dendron-editor-follow-style";
    const defaultStyle = "dendron-editor-default-style";
    const overrideStyle = "dendron-editor-override-style";
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
      <style id="${builtinStyle}">
        body, h1, h2, h3, h4 {
          color: var(--vscode-editor-foreground);
        }

        .main-content ul {
          list-style: unset;
          list-style-type: disc;
        }

        body, .ant-layout {
          background-color: var(--vscode-editor-background);
        }

        a,
        a:hover,
        a:active {
          color: var(--vscode-textLink-foreground);
        }
      </style>
    </head>

    <script type="text/javascript">
      var theme = 'unknown';

      function onload() {
        applyTheme(document.body);

        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutationRecord) {
                applyTheme(mutationRecord.target);
            });
        });
        var target = document.body;
        observer.observe(target, { attributes : true, attributeFilter : ['class'] });
      }

      function addThemeCSS(theme, styleId, keepBuiltin) {
        const themeMap = ${JSON.stringify(themeMap)};

        console.log('Applying theme', theme);

        // Dynamically add css
        const link = document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('href', themeMap[theme]);
        link.setAttribute("id", styleId);

        const oldStyle = document.getElementById(styleId);
        if (oldStyle) {
          // If this theme was applied before (e.g. if user is switching between many themes), then delete the old one first
          document.head.removeChild(oldStyle);
        }

        if (keepBuiltin) {
            document.head.insertBefore(link, document.getElementById("${builtinStyle}"));
        } else {
            document.head.appendChild(link);
        }
      }

      function applyTheme(element) {
        // There are 2 themes in play: the default theme which is based on whether
        // the current user theme is dark or light, and then an optional override
        // theme which overrides that.
        // We have to apply both, because the core dark/light theme includes some
        // styles that are otherwise missing in the default theme, like code highlighting.
        let defaultTheme = element.className;
        const overrideTheme = element.dataset.themeOverride;

        // defaultTheme here will be just dark or light, because those are the core themes that
        // we always need to apply. We also need to pass dark or light to mermaid.
        // overrideTheme may be those, or it may be custom.

        // VSCode prefixes the theme color with vscode-
        const prefix = 'vscode-';
        if (defaultTheme.startsWith(prefix)) {
            // strip prefix
            defaultTheme = defaultTheme.substr(prefix.length);
        }

        // this class is introduced with new vscode setting reduce motion  to reduce the amount of motion
        // in the window.
        var reduceMotionClassName = "vscode-reduce-motion"
        if (defaultTheme.includes(reduceMotionClassName)) {
          defaultTheme = defaultTheme.replace(reduceMotionClassName,"").trim()
        }

        if (defaultTheme === 'high-contrast') {
            defaultTheme = 'dark'; // the high-contrast theme is a dark theme
        }
        if (defaultTheme === "high-contrast-light") {
            defaultTheme = "light"; // the high-contrast-light is a light theme
        }

        if (overrideTheme === "light" || overrideTheme === "dark") {
            // If user picked light or dark as the override, only apply the override
            console.log("Theme override is overriding the default theme", overrideTheme);

            defaultTheme = overrideTheme;
            addThemeCSS(defaultTheme, "${defaultStyle}");
        } else if (overrideTheme === "custom") {
            // If the user picked a custom theme, we first need the default theme then the custom theme.
            // Default first, because it has some critical styles we need. Custom later so the custom can override it.
            addThemeCSS(defaultTheme, "${defaultStyle}");
            addThemeCSS(overrideTheme, "${overrideStyle}");
        } else {
            // Override theme is not set at all. In that case, we want the theme to follow users editor theme.
            // In that case, we prepend the theme so the embedded stylesheet at the end of the head has priority.
            addThemeCSS(defaultTheme, "${defaultStyle}", /* prependBuiltin */ true);
        }

        // NextJS app needs the current theme type to pass it to mermaid
        window.currentTheme = defaultTheme;

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

    <body onload="onload()" data-theme-override="${initialTheme || ""}">
      <div id="main-content-wrap" class="main-content-wrap">
        <div id="main-content" class="main-content">
          <div id="root" data-url="${url}" data-ws="${wsRoot}" data-browser="${browser}" data-name="${name}"></div>
        </div>
      </div>

      <!-- Source code for javascript bundle. Not used in browser mode-->
      <script src="${jsSrc}"></script>
    </body>
  </html>`;
  };
}
