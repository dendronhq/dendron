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
    port,
    wsRoot,
    browser,
    acquireVsCodeApi,
    themeMap,
    initialTheme
  }: {
    jsSrc: string;
    cssSrc: string;
    port: number;
    wsRoot: string;
    browser: boolean;
    acquireVsCodeApi: string
    themeMap: {
      light: string,
      dark: string 
    }
    initialTheme?: string
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
          console.log("calling onLoad");
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

    <body onload="onload()" class="vscode-${initialTheme || "light"}">
      <div id="main-content">
        <div id="root" data-port="${port}" data-ws="${wsRoot}" data-browser="${browser}"></div>
      </div>

      <!-- Source code for javascript bundle. Not used in browser mode-->
      <script src="${jsSrc}"></script>
    </body>
  </html>`;
  };
}
