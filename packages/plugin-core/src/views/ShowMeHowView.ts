import vscode from "vscode";

const getShowMeHowViewHtml = ({ name, src }: { name: string; src: string }) => {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${name}</title>
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
    <iframe id="iframeView" src=${src}></iframe>
  </body>
  
  </html>`;
};

export function showMeHowView(name: string, src: string) {
  const panel = vscode.window.createWebviewPanel(
    name,
    name,
    vscode.ViewColumn.One,
    {
      enableScripts: true,
    }
  );

  panel.webview.html = getShowMeHowViewHtml({ name, src });
}
