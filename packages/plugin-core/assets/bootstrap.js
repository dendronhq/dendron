const window = {
    addEventListener: () => {}
};
const document = {
    getElementById: ()=> {
        return {contentWindow: {
            postMessage: () => {}
        }}
    },
    body: {
        className: "vscode-dark"
    }
};

function acquireVsCodeApi() {
    console.log("acquiring vscode api");
}

// --- Start

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
          if (message.type === "getTheme") {
            console.log("sending theme to client");
            postMsg({
                type: "onThemeChange",
                source: "vscode",
                data: {
                    theme: getTheme().dendronTheme
                }
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
        window.dispatchEvent(new KeyboardEvent('keydown', JSON.parse(e.data)));
      }
    }, false);
}

// --- Test
main()

// main({webClient: "webClient"})