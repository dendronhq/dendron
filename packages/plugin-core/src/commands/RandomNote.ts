import { DendronError, ERROR_SEVERITY, NoteProps, NoteUtils } from "@dendronhq/common-all";
// import { Logger } from "@dendronhq/common-server";
import _ from "lodash";
import { Uri, window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { Logger } from "../logger";
import { VSCodeUtils } from "../utils";
import { getDWorkspace } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = {};

type CommandInput = {};

type CommandOutput = NoteProps | undefined;

export class RandomNoteCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.RANDOM_NOTE.key;

  async gatherInputs(): Promise<CommandInput | undefined> {
    return {};
  }

  async execute(_opts: CommandOpts): Promise<CommandOutput> {
    
    const ctx = "Test_RandomNoteCommand";

    Logger.error({ ctx, msg: "error test in random note command", error:  new DendronError({ message: "inner error" })});

    throw new DendronError({
      message: "Test Show Help Error",
      status: "404",
      severity: ERROR_SEVERITY.MINOR,
      code: 500
    });

    // Logger.error("This is a test error in Random Note");

    const { engine, config } = getDWorkspace();

    // If no pattern is specified for include, then include all notes for the search set.
    const includeSet: string[] = config.randomNote?.include ?? [""];

    const searchPredicate = function (note: NoteProps) {
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
      if (config.randomNote?.exclude) {
        // eslint-disable-next-line no-restricted-syntax
        for (const pattern of config.randomNote?.exclude) {
          if (note.fname.toLowerCase().startsWith(pattern.toLowerCase())) {
            isMatch = false;
            break;
          }
        }
      }

      return isMatch;
    };

    const noteSet = _.filter(engine.notes, (ent) => searchPredicate(ent));

    const noteCount = Object.keys(noteSet).length;
    if (noteCount === 0) {
      window.showInformationMessage(
        "No notes match the search pattern. Adjust the patterns with the Dendron:Configure (yaml) command"
      );
      return;
    }

    const index = Math.floor(Math.random() * noteCount);
    const note = Object.values(noteSet)[index];

    const npath = NoteUtils.getFullPath({
      note,
      wsRoot: engine.wsRoot,
    });

    const uri = Uri.file(npath);
    await VSCodeUtils.openFileInEditor(uri);

    return note;
  }
}
