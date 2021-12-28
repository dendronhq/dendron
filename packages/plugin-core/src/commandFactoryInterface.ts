import vscode from "vscode";
import { BaseCommand } from "./commands/base";
import {
  ShowPreviewCommandOpts,
  ShowPreviewCommandOutput,
} from "./commands/ShowPreviewInterface";
import {
  GoToNoteCommandOpts,
  GoToNoteCommandOutput,
} from "./commands/GoToNoteInterface";

export interface ICommandFactory {
  showPreviewCmd(
    panel: vscode.WebviewPanel
  ): BaseCommand<ShowPreviewCommandOpts, ShowPreviewCommandOutput>;

  goToNoteCmd(): BaseCommand<GoToNoteCommandOpts, GoToNoteCommandOutput>;
}
