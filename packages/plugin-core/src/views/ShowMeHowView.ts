import vscode from "vscode";

const getShowMeHowViewHtml = ({ name, src }: { name: string; src: string }) => {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${name}</title>
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
    <a href="https://www.loom.com/share/f2c53d2a5aeb48209b5587a3dfbb1015"><img alt="Click on menu icon in the Graph View to change themes" src=${src} /></a>
  </div>
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
