import vscode from "vscode";

export type showMeHowViewOpts = {
  name: string;
  src: string;
  href: string;
  alt?: string;
};
const getShowMeHowViewHtml = (opts: showMeHowViewOpts) => {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${opts.name}</title>
    <style>
      html, body {
        margin: 0px;
        height: 100%;
        overflow: hidden;
      }
      .img-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
      }
    </style>
  </head>
  <body>
  <div class="img-container">
    <a href="${opts.href}"><img alt="${opts.alt}" src=${opts.src} /></a>
  </div>
  </body>
  
  </html>`;
};

export function showMeHowView(opts: showMeHowViewOpts) {
  const panel = vscode.window.createWebviewPanel(
    opts.name,
    opts.name,
    vscode.ViewColumn.One,
    {
      enableScripts: true,
    }
  );

  panel.webview.html = getShowMeHowViewHtml(opts);
}
