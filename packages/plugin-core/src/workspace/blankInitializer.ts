import {
  DendronError, DVault
} from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import { Snippets } from "@dendronhq/engine-server";
import fs from "fs-extra";
import path from "path";
import * as vscode from "vscode";
import { DendronWorkspace } from "../workspace";
import { Logger } from "../logger";
import { VSCodeUtils } from "../utils";
import { MarkdownUtils } from "../utils/md";
import { WorkspaceInitializer } from "./workspaceInitializer";


/**
 * Blank Workspace Initializer. Creates the barebones requirements for a functioning workspace
 */
 export class BlankInitializer implements WorkspaceInitializer {
  createVaults = () => {
    return [{ fsPath: "vault" }];
  };

  async onWorkspaceCreation(opts: { vaults: DVault[]; wsRoot: string }): Promise<void> {
    const ws = DendronWorkspace.instance();

    const vpath = vault2Path({ vault: opts.vaults[0], wsRoot: opts.wsRoot });
    
    // copy over jekyll config
    const dendronJekyll = VSCodeUtils.joinPath(ws.extensionAssetsDir, "jekyll");
    fs.copySync(path.join(dendronJekyll.fsPath), path.join(opts.wsRoot, "docs"));

    // write snippets
    const vscodeDir = path.join(vpath, ".vscode");
    Snippets.create(vscodeDir);
  };

  async onWorkspaceOpen(opts: { ws: DendronWorkspace }): Promise<void> {
    const ctx = "BlankInitializer.onWorkspaceOpen";

    const rootUri = VSCodeUtils.joinPath(
      opts.ws.rootWorkspace.uri,
      "root.md"
    );

    if (fs.pathExistsSync(rootUri.fsPath)) {
      // Set the view to have the tutorial page showing with the preview opened to the side.
      await vscode.window.showTextDocument(rootUri);
      await MarkdownUtils.openPreview({ reuseWindow: false });
    } else {
      Logger.error({
        ctx,
        error: new DendronError({ message: `Unable to find root.md` }),
      });
    }
  };
}