import {
  DendronError,
  DVault,
  NoteUtils,
  RespV3,
  VaultUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import { DENDRON_COMMANDS } from "../constants";
import { ExtensionProvider } from "../ExtensionProvider";
import { getLinkFromSelectionWithWorkspace } from "../utils/editor";
import { DendronExtension } from "../workspace";
import { BasicCommand } from "./base";
import { GotoNoteCommand } from "./GotoNote";
import { GoToNoteCommandOutput, TargetKind } from "./GoToNoteInterface";
import { OpenLinkCommand } from "./OpenLink";

type CommandOpts = {};

type CommandInput = {};

type CommandOutput = RespV3<GoToNoteCommandOutput>;

export class GotoCommand extends BasicCommand<CommandOpts, CommandOutput> {
  key = DENDRON_COMMANDS.GOTO.key;

  constructor(private _ext: DendronExtension) {
    super();
  }

  async gatherInputs(): Promise<CommandInput | undefined> {
    return {};
  }
  async execute(): Promise<CommandOutput> {
    const { vaults, engine } = ExtensionProvider.getDWorkspace();

    const link = await getLinkFromSelectionWithWorkspace();
    if (!link) {
      return {
        error: new DendronError({ message: "selection is not a valid link" }),
      };
    }

    // get vault
    let vault: DVault | undefined;
    const { anchorHeader, value: fname, vaultName } = link;
    if (vaultName) {
      vault = VaultUtils.getVaultByNameOrThrow({
        vaults,
        vname: vaultName,
      });
    }

    // get note
    const notes = NoteUtils.getNotesByFnameFromEngine({
      fname,
      engine,
      vault,
    });
    if (notes.length === 0) {
      return {
        error: new DendronError({ message: "selection is not a note" }),
      };
    }

    // TODO: for now, get first note, in the future, show prompt
    const note = notes[0];

    // if note doesn't have url, run goto note command
    if (_.isUndefined(note.custom.url)) {
      const resp = await new GotoNoteCommand(this._ext).execute({
        qs: note.fname,
        vault: note.vault,
        anchor: anchorHeader,
      });
      return { data: resp };
    }

    // we found a link
    await new OpenLinkCommand().execute({ url: note.custom.url });
    return {
      data: {
        kind: TargetKind.LINK,
        fullPath: note.custom.url,
      },
    };
  }
}
