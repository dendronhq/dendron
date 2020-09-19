// import * as path from "path";
// import { workspace, ExtensionContext } from "vscode";

// import {
//   LanguageClient,
//   LanguageClientOptions,
//   ServerOptions,
//   TransportKind,
// } from "vscode-languageclient";
// import { Logger } from "./logger";
// import fs from "fs-extra";

// let client: LanguageClient;

// export function startClient(context: ExtensionContext) {
//   const isDev = fs.existsSync(
//     path.join("node_modules", "@dendronhq", "lsp-server", "lib", "index.js")
//   );
//   let serverModule: string;

//   if (isDev) {
//     serverModule = context.asAbsolutePath(
//       path.join("node_modules", "@dendronhq", "lsp-server", "lib", "index.js")
//     );
//   } else {
//     serverModule = context.asAbsolutePath(
//       path.join("dist", "lsp-server", "lib", "index.js")
//     );
//   }

//   Logger.info({ serverModule, msg: "starting client" });
//   // The debug options for the server
//   // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
//   let debugOptions = { execArgv: ["--nolazy", "--inspect=6009"] };

//   // If the extension is launched in debug mode then the debug server options are used
//   // Otherwise the run options are used
//   let serverOptions: ServerOptions = {
//     run: { module: serverModule, transport: TransportKind.ipc },
//     debug: {
//       module: serverModule,
//       transport: TransportKind.ipc,
//       options: debugOptions,
//     },
//   };

//   let clientOptions: LanguageClientOptions = {
//     documentSelector: [{ scheme: "file", language: "markdown" }],
//     synchronize: {
//       fileEvents: workspace.createFileSystemWatcher("**/.clientrc"),
//     },
//   };

//   // Create the language client and start the client.
//   client = new LanguageClient(
//     "dendron.lsp",
//     "Dendron LSP",
//     serverOptions,
//     clientOptions
//   );

//   client.start();
// }

// export function deactivate(): Thenable<void> | undefined {
//   if (!client) {
//     return undefined;
//   }
//   return client.stop();
// }
