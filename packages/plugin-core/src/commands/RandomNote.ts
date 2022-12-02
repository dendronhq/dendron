import { ConfigUtils, NotePropsMeta, NoteUtils } from "@dendronhq/common-all";
import _ from "lodash";
import { Uri, window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { VSCodeUtils } from "../vsCodeUtils";
import { BasicCommand } from "./base";

type CommandOpts = {};

type CommandInput = {};

type CommandOutput = NotePropsMeta | undefined;

export class RandomNoteCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.RANDOM_NOTE.key;
  constructor(private _ext: IDendronExtension) {
    super();
  }

  async gatherInputs(): Promise<CommandInput | undefined> {
    return {};
  }

  async execute(_opts: CommandOpts): Promise<CommandOutput> {
    const ws = this._ext.getDWorkspace();
    const { engine } = ws;
    const config = await ws.config;

    // If no pattern is specified for include, then include all notes for the search set.
    const randomNoteConfig = ConfigUtils.getCommands(config).randomNote;
    const includeSet: string[] = randomNoteConfig.include ?? [""];

    const searchPredicate = function (note: NotePropsMeta) {
      if (note.stub === true) {
        return false;
      }

      let isMatch = false;

      // eslint-disable-next-line no-restricted-syntax
      for (const pattern of includeSet) {
        if (note.fname.toLowerCase().startsWith(pattern.toLowerCase())) {
          isMatch = true;
          break;
        }
      }

      // Remove Exclude Paths, if specified:
      if (randomNoteConfig.exclude) {
        // eslint-disable-next-line no-restricted-syntax
        for (const pattern of randomNoteConfig.exclude) {
          if (note.fname.toLowerCase().startsWith(pattern.toLowerCase())) {
            isMatch = false;
            break;
          }
        }
      }

      return isMatch;
    };
    // TODO: Potentially expensive call. Consider deferring to engine
    const notesToPick = await engine.findNotesMeta({ excludeStub: true });
    const noteSet = _.filter(notesToPick, (ent) => searchPredicate(ent));

    const noteCount = noteSet.length;
    if (noteCount === 0) {
      window.showInformationMessage(
        "No notes match the search pattern. Adjust the patterns with the Dendron:Configure (yaml) command"
      );
      return;
    }

    const index = Math.floor(Math.random() * noteCount);
    const note = noteSet[index];

    const npath = NoteUtils.getFullPath({
      note,
      wsRoot: engine.wsRoot,
    });

    const uri = Uri.file(npath);
    await VSCodeUtils.openFileInEditor(uri);

    return note;
  }
}
