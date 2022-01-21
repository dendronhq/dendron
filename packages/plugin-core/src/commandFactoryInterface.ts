import { BaseCommand } from "./commands/base";
import {
  GoToNoteCommandOpts,
  GoToNoteCommandOutput,
} from "./commands/GoToNoteInterface";
import {
  ShowPreviewCommandOpts,
  ShowPreviewCommandOutput,
} from "./commands/ShowPreviewInterface";
import { PreviewProxy } from "./components/views/PreviewProxy";

export interface ICommandFactory {
  showPreviewCmd(
    panel: PreviewProxy
  ): BaseCommand<ShowPreviewCommandOpts, ShowPreviewCommandOutput>;

  goToNoteCmd(): BaseCommand<GoToNoteCommandOpts, GoToNoteCommandOutput>;
}
