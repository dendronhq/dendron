import {
  DendronConfig,
  DendronError,
  DVault,
  DWorkspaceV2,
  TutorialEvents,
  WorkspaceType,
  DEngineClient,
} from "@dendronhq/common-all";
import { readMD, resolveTilde } from "@dendronhq/common-server";
import { DConfig } from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { SetupWorkspaceCommand } from "../commands/SetupWorkspace";
import { VSCodeUtils } from "../utils";
import { AnalyticsUtils } from "../utils/analytics";
import { TutorialInitializer } from "./tutorialInitializer";
import fs from "fs-extra";

export abstract class DendronBaseWorkspace implements DWorkspaceV2 {
  public wsRoot: string;
  public type = WorkspaceType.NATIVE;
  public vaults: DVault[];
  public logUri: vscode.Uri;
  public assetUri: vscode.Uri;
  protected _engine?: DEngineClient;

  constructor({
    wsRoot,
    logUri,
    assetUri,
  }: {
    wsRoot: string;
    logUri: vscode.Uri;
    assetUri: vscode.Uri;
  }) {
    this.wsRoot = wsRoot;
    this.logUri = logUri;
    this.vaults = this.config.vaults;
    this.assetUri = assetUri;
  }

  get config(): DendronConfig {
    return DConfig.defaults(DConfig.getOrCreate(this.wsRoot));
  }

  get engine(): DEngineClient {
    if (!this._engine) {
      throw new DendronError({ message: "no engiine set" });
    }
    return this._engine;
  }

  set engine(engine: DEngineClient) {
    this._engine = engine;
  }

  async showWelcome() {
    try {
      // NOTE: this needs to be from extension because no workspace might exist at this point
      const uri = VSCodeUtils.joinPath(
        this.assetUri,
        "dendron-ws",
        "vault",
        "welcome.html"
      );

      const { content } = readMD(uri.fsPath);
      const title = "Welcome to Dendron";

      const panel = vscode.window.createWebviewPanel(
        _.kebabCase(title),
        title,
        vscode.ViewColumn.One,
        {
          enableScripts: true,
        }
      );
      panel.webview.html = content;

      panel.webview.onDidReceiveMessage(
        async (message) => {
          switch (message.command) {
            case "loaded":
              AnalyticsUtils.track(TutorialEvents.WelcomeShow);
              return;

            case "initializeWorkspace": {
              // Try to put into a Default '~/Dendron' folder first. Only prompt
              // if that path and the backup path already exist to lower
              // onboarding friction
              let wsPath;
              const wsPathPrimary = path.join(resolveTilde("~"), "Dendron");
              const wsPathBackup = path.join(
                resolveTilde("~"),
                "Dendron-Tutorial"
              );

              if (!fs.pathExistsSync(wsPathPrimary)) {
                wsPath = wsPathPrimary;
              } else if (!fs.pathExistsSync(wsPathBackup)) {
                wsPath = wsPathBackup;
              }

              if (!wsPath) {
                await new SetupWorkspaceCommand().run({
                  workspaceInitializer: new TutorialInitializer(),
                });
              } else {
                await new SetupWorkspaceCommand().execute({
                  rootDirRaw: wsPath,
                  workspaceInitializer: new TutorialInitializer(),
                });
              }

              return;
            }
            default:
              break;
          }
        },
        undefined,
        undefined
      );
    } catch (err) {
      vscode.window.showErrorMessage(JSON.stringify(err));
    }
  }
}
