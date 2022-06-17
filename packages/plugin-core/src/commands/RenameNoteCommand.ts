import {
  DNodeUtils,
  EngagementEvents,
  extractNoteChangeEntryCounts,
  VaultUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import { DENDRON_COMMANDS } from "../constants";
import { ExtensionProvider } from "../ExtensionProvider";
import { AnalyticsUtils } from "../utils/analytics";
import { BasicCommand } from "./base";
import {
  MoveNoteCommand,
  CommandOpts as MoveNoteCommandOpts,
  CommandOutput as MoveNoteCommandOutput,
} from "./MoveNoteCommand";

type CommandOpts = MoveNoteCommandOpts;
type CommandInput = any;
type CommandOutput = MoveNoteCommandOutput;

/**
 * This is `Dendron: Rename Note`.
 * Currently (as of 2022-06-15),
 * this is simply wrapping methods of the move note command and calling them with a custom option.
 * This is done to correctly register the command and to properly instrument command usage.
 *
 * TODO: refactor move and rename logic, redesign arch for both commands.
 */
export class RenameNoteCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.RENAME_NOTE.key;
  private _moveNoteCommand = new MoveNoteCommand();

  async sanityCheck() {
    return this._moveNoteCommand.sanityCheck();
  }

  private populateCommandOpts(opts: CommandOpts): MoveNoteCommandOpts {
    return {
      allowMultiselect: false,
      useSameVault: true,
      title: "Rename Note",
      ...opts,
    };
  }

  async gatherInputs(opts: CommandOpts): Promise<CommandInput | undefined> {
    return this._moveNoteCommand.gatherInputs(this.populateCommandOpts(opts));
  }

  async trackProxyMetrics({
    opts,
    noteChangeEntryCounts,
  }: {
    opts: CommandOpts;
    noteChangeEntryCounts: {
      createdCount?: number;
      deletedCount?: number;
      updatedCount?: number;
    };
  }) {
    const extension = ExtensionProvider.getExtension();
    const engine = extension.getEngine();
    const { vaults } = engine;

    // we only have one move for this particular command
    const { moves } = opts;

    const move = moves[0];

    const { fname, vaultName: vname } = move.newLoc;
    if (fname === undefined || vname === undefined) {
      return;
    }
    const vault = VaultUtils.getVaultByName({ vaults, vname });
    const note = (await engine.findNotes({ fname, vault }))[0];
    if (note === undefined) {
      return;
    }

    AnalyticsUtils.track(EngagementEvents.RefactoringCommandUsed, {
      command: this.key,
      ...noteChangeEntryCounts,
      numVaults: engine.vaults.length,
      traits: note.traits,
      numChildren: note.children.length,
      numLinks: note.links.length,
      numChars: note.body.length,
      noteDepth: DNodeUtils.getDepth(note),
    });
  }

  addAnalyticsPayload(opts: CommandOpts, out: CommandOutput) {
    const noteChangeEntryCounts =
      out !== undefined ? { ...extractNoteChangeEntryCounts(out.changed) } : {};
    try {
      this.trackProxyMetrics({ opts, noteChangeEntryCounts });
    } catch (error) {
      this.L.error({ error });
    }
    return noteChangeEntryCounts;
  }

  async execute(opts: CommandOpts): Promise<CommandOutput> {
    return this._moveNoteCommand.execute(this.populateCommandOpts(opts));
  }
}
