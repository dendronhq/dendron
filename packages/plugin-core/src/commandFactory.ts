/**
 * Class responsible for creation of commands, specifically useful when one
 * command needs an instance of another command, this adds in a layer of
 * decoupling.
 */
import { ICommandFactory } from "./commandFactoryInterface";
import { BaseCommand } from "./commands/base";
import { GotoNoteCommand } from "./commands/GotoNote";
import {
  GoToNoteCommandOpts,
  GoToNoteCommandOutput,
} from "./commands/GoToNoteInterface";
import { ShowPreviewCommand } from "./commands/ShowPreview";
import {
  ShowPreviewCommandOpts,
  ShowPreviewCommandOutput,
} from "./commands/ShowPreviewInterface";
import { PreviewProxy } from "./components/views/PreviewProxy";
import { IDendronExtension } from "./dendronExtensionInterface";

export class CommandFactory implements ICommandFactory {
  private readonly extension: IDendronExtension;

  constructor(extension: IDendronExtension) {
    this.extension = extension;
  }

  showPreviewCmd(
    panel: PreviewProxy
  ): BaseCommand<ShowPreviewCommandOpts, ShowPreviewCommandOutput> {
    return new ShowPreviewCommand(panel);
  }

  goToNoteCmd(): BaseCommand<GoToNoteCommandOpts, GoToNoteCommandOutput> {
    return new GotoNoteCommand(this.extension);
  }
}
