import { TreeViewItemLabelTypeEnum } from "@dendronhq/common-all";
import "reflect-metadata"; // This needs to be the topmost import for tsyringe to work

import { container } from "tsyringe";
import * as vscode from "vscode";
import { CopyNoteURLCmd } from "./commands/CopyNoteURLCmd";
import { NoteLookupCmd } from "./commands/NoteLookupCmd";
import { setupWebExtContainer } from "./injection-providers/setupWebExtContainer";
import { NativeTreeView } from "./views/treeView/NativeTreeView";

/**
 * This is the entry point for the web extension variant of Dendron
 * @param context
 */
export async function activate(context: vscode.ExtensionContext) {
  try {
    // Use the web extension injection container:
    await setupWebExtContainer();

    setupCommands(context);

    setupViews(context);
  } catch (error) {
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

  const key = "dendron.lookupNote";
  const cmd = container.resolve(NoteLookupCmd);

  if (!existingCommands.includes(key))
    context.subscriptions.push(
      vscode.commands.registerCommand(key, async (_args: any) => {
        await cmd.run();
      })
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
