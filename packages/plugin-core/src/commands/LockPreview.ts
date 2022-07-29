import { ExtensionProvider } from "../ExtensionProvider";
import { PreviewProxy } from "../components/views/PreviewProxy";
import { DENDRON_COMMANDS } from "../constants";
import { BasicCommand } from "./base";

type CommandInput = {};

type CommandOpts = {};
type CommandOutput = CommandOpts;

export class LockPreviewCommand extends BasicCommand<
  CommandOpts,
  CommandOutput,
  CommandInput
> {
  key = DENDRON_COMMANDS.LOCK_PREVIEW.key;
  _panel: PreviewProxy | undefined;

  constructor(previewPanel: PreviewProxy | undefined) {
    super();
    this._panel = previewPanel;
  }

  async sanityCheck() {
    if (!this._panel || !this._panel.isVisible()) {
      return "No preview currently open";
    }
    return;
  }

  async execute(_opts?: CommandOpts) {
    if (this._panel) {
      if (this._panel.isLocked()) {
        this._panel.unlock();
        const note = ExtensionProvider.getWSUtils().getActiveNote();
        if (note) {
          this._panel.show(note);
        }
      } else {
        this._panel.lock();
      }
    }

    return {};
  }
}
