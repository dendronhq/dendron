/**
 * Class responsible for creation of commands, specifically useful when one
 * command needs an instance of another command, this adds in a layer of
 * decoupling.
 */
import { BaseCommand } from "./commands/base";
import {
  ShowPreviewCommandOpts,
  ShowPreviewCommandOutput,
} from "./commands/ShowPreviewInterface";
import { ShowPreviewCommand } from "./commands/ShowPreview";
import vscode from "vscode";
import { ICommandFactory } from "./commandFactoryInterface";
import {
  GoToNoteCommandOpts,
  GoToNoteCommandOutput,
} from "./commands/GoToNoteInterface";
import { GotoNoteCommand } from "./commands/GotoNote";
import { IDendronExtension } from "./dendronExtensionInterface";

export class CommandFactory implements ICommandFactory {
  private readonly extension: IDendronExtension;

  constructor(extension: IDendronExtension) {
    this.extension = extension;
  }

  showPreviewCmd(
    panel: vscode.WebviewPanel
  ): BaseCommand<ShowPreviewCommandOpts, ShowPreviewCommandOutput> {
    return new ShowPreviewCommand(panel);
  }

  goToNoteCmd(): BaseCommand<GoToNoteCommandOpts, GoToNoteCommandOutput> {
    return new GotoNoteCommand(this.extension);
  }
}
