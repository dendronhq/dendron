import _ from "lodash";
import * as vscode from "vscode";
import { GLOBAL_STATE } from "./constants";
import { Logger } from "./logger";
import { Settings } from "./settings";
import { VSCodeUtils } from "./utils";
import { DendronWorkspace } from "./workspace";
import { getStage } from "@dendronhq/common-all";
import { HistoryService } from "./services/HistoryService";

// === Main
// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  const ctx = "activate";
  const stage = getStage();
  const {
    logPath,
    extensionPath,
    extensionUri,
    storagePath,
    globalStoragePath,
  } = context;
  if (stage === "test") {
    context = VSCodeUtils.getOrCreateMockContext();
  }
  // setup logging
  const previousVersion = context.globalState.get<string | undefined>(
    GLOBAL_STATE.VERSION
  );
  Logger.configure(context, "debug");
  Logger.info({
    ctx,
    stage,
    logPath,
    extensionPath,
    extensionUri,
    storagePath,
    globalStoragePath,
    previousVersion,
  });
  // needs to be initialized to setup commands
  const ws = new DendronWorkspace(context);

  if (DendronWorkspace.isActive()) {
    Logger.info({ msg: "reloadWorkspace:pre" });
    ws.reloadWorkspace().then(async () => {
      Logger.info({ ctx, msg: "dendron ready" }, true);
      if (
        _.isUndefined(
          context.globalState.get<string | undefined>(
            GLOBAL_STATE.DENDRON_FIRST_WS
          )
        )
      ) {
        Logger.info({ ctx, msg: "show welcome" });
        const step = ws.context.globalState.get<string | undefined>(
          GLOBAL_STATE.DENDRON_FIRST_WS_TUTORIAL_STEP
        );
        if (_.isUndefined(step)) {
          await ws.showWelcome();
          Logger.info({ ctx, step: -1 }, true);
          await ws.updateGlobalState("DENDRON_FIRST_WS", "initialized");
          await ws.updateGlobalState("DENDRON_FIRST_WS_TUTORIAL_STEP", "0");
        } else {
          switch (step) {
            case "0":
              Logger.info({ msg: "going to step", step }, true);
              break;
            default:
              Logger.info({ msg: "", step });
          }
        }
      } else {
        Logger.info({ ctx, msg: "user finished welcome" });
      }
    });
  } else {
    Logger.info({ ctx: "dendron not active" });
  }
  if (VSCodeUtils.isDebuggingExtension()) {
    // Logger.output?.show(false);
    // TODO: check for cmd
    // const fullLogPath = FileUtils.escape(path.join(logPath, 'dendron.log'));
    // TODO
    // const cmd = `/usr/local/bin/code-insiders ${fullLogPath}`;
    // execa.command(cmd);
    vscode.window.showInformationMessage("activate");
  }
  // TODO: don't hardcode version
  showWelcomeOrWhatsNew(ws.version, previousVersion).then(() => {
    HistoryService.instance().add({ source: "extension", action: "activate" });
  });
}

// this method is called when your extension is deactivated
export function deactivate() {
  const ctx = "deactivate";
  const { DendronWorkspace } = require("./workspace");
  const ws = DendronWorkspace.instance();
  ws.L.info({ ctx });
}

async function showWelcomeOrWhatsNew(
  version: string,
  previousVersion: string | undefined
) {
  const ctx = "showWelcomeOrWhatsNew";
  Logger.info({ ctx, version, previousVersion });
  const ws = DendronWorkspace.instance();
  if (_.isUndefined(previousVersion)) {
    Logger.info({ ctx, msg: "first time install" });
    // NOTE: this needs to be from extension because no workspace might exist at this point
    const uri = vscode.Uri.joinPath(ws.context.extensionUri, "README.md");
    await ws.context.globalState.update(GLOBAL_STATE.VERSION, version);
    await ws.showWelcome(uri, { reuseWindow: true });
  } else {
    Logger.info({ ctx, msg: "not first time install" });
    if (version !== previousVersion) {
      Logger.info({ ctx, msg: "new version", version, previousVersion });
      const config = vscode.workspace.getConfiguration();
      const changed = await Settings.upgrade(
        config,
        Settings.defaultsChangeSet()
      );
      Logger.info({ ctx, msg: "settings upgraded", changed });
      await ws.context.globalState.update(GLOBAL_STATE.VERSION, version);
      vscode.window.showInformationMessage(
        `Dendron has been upgraded to ${version} from ${previousVersion}`,
        "See what changed"
      ).then(resp => {
        if (resp === "See what changed") {
          vscode.commands.executeCommand('vscode.open', vscode.Uri.parse('https://github.com/dendronhq/dendron/blob/master/CHANGELOG.md#change-log'));
        }
      });
    }
  }
}
