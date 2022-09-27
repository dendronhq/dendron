import "reflect-metadata"; // This needs to be the topmost import for tsyringe to work

import { TreeViewItemLabelTypeEnum, VSCodeEvents } from "@dendronhq/common-all";
import { container } from "tsyringe";
import * as vscode from "vscode";
import { NoteLookupAutoCompleteCommand } from "../commands/common/NoteLookupAutoCompleteCommand";
import { DENDRON_COMMANDS } from "../constants";
import { ITelemetryClient } from "../telemetry/common/ITelemetryClient";
import { NativeTreeView } from "../views/common/treeview/NativeTreeView";
import { CopyNoteURLCmd } from "./commands/CopyNoteURLCmd";
import { NoteLookupCmd } from "./commands/NoteLookupCmd";
import { TogglePreviewCmd } from "./commands/TogglePreviewCmd";
import { setupWebExtContainer } from "./injection-providers/setupWebExtContainer";

/**
 * This is the entry point for the web extension variant of Dendron
 * @param context
 */
export async function activate(context: vscode.ExtensionContext) {
  try {
    // Use the web extension injection container:
    await setupWebExtContainer(context);

    setupCommands(context);

    setupViews(context);

    reportActivationTelemetry();
  } catch (error) {
    // TODO: properly detect if we're in a Dendron workspace or not (instead of
    // relying on getWSRoot throwing).
    vscode.window.showErrorMessage(
      `Something went wrong during initialization.`
    );
  }

  vscode.commands.executeCommand("setContext", "dendron:pluginActive", true);
  vscode.window.showInformationMessage("Dendron is active");
}

export function deactivate() {}

async function setupCommands(context: vscode.ExtensionContext) {
  const existingCommands = await vscode.commands.getCommands();

  const noteLookupCmd = container.resolve(NoteLookupCmd);
  const key = DENDRON_COMMANDS.LOOKUP_NOTE.key;

  if (!existingCommands.includes(key))
    context.subscriptions.push(
      vscode.commands.registerCommand(key, async (_args: any) => {
        await noteLookupCmd.run();
      })
    );

  const noteLookupAutoCompleteCommand = container.resolve(
    NoteLookupAutoCompleteCommand
  );

  const noteLookupAutoCompleteCommandKey =
    DENDRON_COMMANDS.LOOKUP_NOTE_AUTO_COMPLETE.key;
  if (!existingCommands.includes(noteLookupAutoCompleteCommandKey))
    context.subscriptions.push(
      vscode.commands.registerCommand(noteLookupAutoCompleteCommandKey, () => {
        noteLookupAutoCompleteCommand.run();
      })
    );

  const togglePreviewCmd = container.resolve(TogglePreviewCmd);
  const togglePreviewCmdKey = DENDRON_COMMANDS.TOGGLE_PREVIEW.key;

  if (!existingCommands.includes(togglePreviewCmdKey))
    context.subscriptions.push(
      vscode.commands.registerCommand(
        togglePreviewCmdKey,
        async (_args: any) => {
          await togglePreviewCmd.run();
        }
      )
    );

  if (!existingCommands.includes(CopyNoteURLCmd.key)) {
    context.subscriptions.push(
      vscode.commands.registerCommand(
        CopyNoteURLCmd.key,
        async (_args: any) => {
          await container.resolve(CopyNoteURLCmd).run();
        }
      )
    );
  }
  if (!existingCommands.includes(DENDRON_COMMANDS.TREEVIEW_CREATE_NOTE.key)) {
    context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.TREEVIEW_CREATE_NOTE.key,
        async (_args: any) => {
          await container.resolve(NoteLookupCmd).run();
        }
      )
    );
  }
}

async function setupViews(context: vscode.ExtensionContext) {
  await setupTreeView(context);
}

async function setupTreeView(context: vscode.ExtensionContext) {
  const treeView = container.resolve(NativeTreeView);

  treeView.show();

  context.subscriptions.push(treeView);

  vscode.commands.registerCommand("dendron.treeView.labelByTitle", () => {
    treeView.updateLabelType({
      labelType: TreeViewItemLabelTypeEnum.title,
    });
  });

  vscode.commands.registerCommand("dendron.treeView.labelByFilename", () => {
    treeView.updateLabelType({
      labelType: TreeViewItemLabelTypeEnum.filename,
    });
  });
}

async function reportActivationTelemetry() {
  const telemetryClient =
    container.resolve<ITelemetryClient>("ITelemetryClient");

  await telemetryClient.identify();
  // TODO: Add workspace properties later.
  await telemetryClient.track(VSCodeEvents.InitializeWorkspace);
}
