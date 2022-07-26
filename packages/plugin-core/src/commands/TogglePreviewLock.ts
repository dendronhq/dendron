import { ExtensionProvider } from "../ExtensionProvider";
import { PreviewProxy } from "../components/views/PreviewProxy";
import { DENDRON_COMMANDS } from "../constants";
import { BasicCommand } from "./base";

type CommandInput = {};

type CommandOpts = {};
type CommandOutput = CommandOpts;

export class TogglePreviewLockCommand extends BasicCommand<
  CommandOpts,
  CommandOutput,
  CommandInput
> {
  key = DENDRON_COMMANDS.TOGGLE_PREVIEW_LOCK.key;
  _panel: PreviewProxy;

  constructor(previewPanel: PreviewProxy) {
    super();
    this._panel = previewPanel;
  }

  async execute(_opts: CommandOpts) {
    if (this._panel.isLocked()) {
      this._panel.unlock();
      const note = ExtensionProvider.getWSUtils().getActiveNote();
      if (note) {
        this._panel.show(note);
      }
    } else {
      this._panel.lock();
    }

    return {};
  }
}
