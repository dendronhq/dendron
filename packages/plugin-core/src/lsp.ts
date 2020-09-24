import path from "path";
import fs from "fs-extra";
import { workspace, ExtensionContext } from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient";
import { Logger } from "./logger";

export function startClient(context: ExtensionContext) {
  // The server is implemented in node
  const pathToDev = path.join(
    __dirname,
    "..",
    "node_modules",
    "@dendronhq",
    "lsp-server",
    "out",
    "server.js"
  );

  let serverModule: string;
  const isDev = fs.existsSync(pathToDev);
  if (isDev) {
    serverModule = pathToDev;
  } else {
    serverModule = context.asAbsolutePath(
      path.join("dist", "lsp-server", "out", "server.js")
    );
  }
  const ctx = "startLSPClient";
  Logger.info({ ctx, serverModule, isDev, msg: "starting client" });

  // TODO: don't hradcode
  // let expressModule = context.asAbsolutePath(
  //   path.join("express-server", "dist", "src", "index.js")
  // );
  // const { app: server } = require(expressModule);
  // The debug options for the server
  // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
  let debugOptions = { execArgv: ["--nolazy", "--inspect=6009"] };
  let client: LanguageClient;

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  let serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions,
    },
  };

  // Options to control the language client
  let clientOptions: LanguageClientOptions = {
    // Register the server for plain text documents
    documentSelector: [{ scheme: "file", language: "markdown" }],
    synchronize: {
      // Notify the server about file changes to '.clientrc files contained in the workspace
      fileEvents: workspace.createFileSystemWatcher("**/.clientrc"),
    },
  };

  // Create the language client and start the client.
  client = new LanguageClient(
    "dendron.lsp",
    "Dendron LSP",
    serverOptions,
    clientOptions,
    true
  );

  // Start the client. This will also launch the server
  client.start();
  // const port = 3000;
  // server.listen(3000, () => {
  //   console.log("express server started");
  // });
  return { client };
}
