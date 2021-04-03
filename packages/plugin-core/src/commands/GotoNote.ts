import {
  DNoteAnchor,
  DVault,
  getSlugger,
  NoteProps,
  NoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import {
  Heading,
  matchWikiLink,
  ParserUtilsV2,
} from "@dendronhq/engine-server";
import _ from "lodash";
import { Position, Selection, Uri, window } from "vscode";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { DENDRON_COMMANDS } from "../constants";
import { VSCodeUtils } from "../utils";
import { DendronWorkspace, getWS } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = {
  qs?: string;
  vault?: DVault;
  anchor?: DNoteAnchor;
  overrides?: Partial<NoteProps>;
};
export { CommandOpts as GotoNoteCommandOpts };

type CommandOutput = { note: NoteProps; pos?: Position } | undefined;

export const findHeaderPos = (opts: { anchor: string; text: string }) => {
  const { anchor, text } = opts;
  const anchorSlug = getSlugger().slug(anchor);
  // TODO: optimize by doing this on startup
  const headers = ParserUtilsV2.findHeaders(text);
  const headerMatch: Heading | undefined = _.find(headers, (h) => {
    return getSlugger().slug(h.children[0].value as string) === anchorSlug;
  });
  if (headerMatch) {
    const line = (headerMatch.position?.start.line as number) - 1;
    const pos = new Position(line, 0);
    return pos;
  }
  return new Position(0, 0);
};

export class GotoNoteCommand extends BasicCommand<CommandOpts, CommandOutput> {
  static key = DENDRON_COMMANDS.GOTO_NOTE.key;

  getLinkFromSelection() {
    const { selection, editor } = VSCodeUtils.getSelection();
    if (!_.isEmpty(selection) && selection?.start) {
      const currentLine = editor?.document.getText().split("\n")[
        selection.start.line
      ];
      if (currentLine) {
        const out = matchWikiLink(currentLine);
        if (out && _.inRange(selection.start.character, out.start, out.end)) {
          return out.link;
        }
      }
    }
    return;
  }
  async execute(opts: CommandOpts): Promise<CommandOutput> {
    const ctx = "GotoNoteCommand";
    this.L.info({ ctx, opts, msg: "enter" });
    let { overrides } = opts;
    let qs: string;
    let vault: DVault;
    if (!opts.qs) {
      const maybeLink = this.getLinkFromSelection();
      if (!maybeLink) {
        window.showErrorMessage("selection is not a valid link");
        return;
      }
      qs = maybeLink.value as string;
      const vaults = getWS().vaultsv4;
      if (maybeLink.vaultName) {
        vault = VaultUtils.getVaultByNameOrThrow({
          vaults,
          vname: maybeLink.vaultName,
        });
      } else {
        vault = PickerUtilsV2.getOrPromptVaultForOpenEditor();
      }

      if (maybeLink.anchorHeader) {
        opts.anchor = {
          type: "header",
          value: maybeLink.anchorHeader,
        };
      }
    }
    let pos: undefined | Position;
    const client = DendronWorkspace.instance().getEngine();
    const out = await DendronWorkspace.instance().pauseWatchers<CommandOutput>(
      async () => {
        const { data } = await client.getNoteByPath({
          npath: qs,
          createIfNew: true,
          vault,
          overrides,
        });
        const note = data?.note as NoteProps;
        const npath = NoteUtils.getPathV4({
          note,
          wsRoot: DendronWorkspace.wsRoot(),
        });
        const uri = Uri.file(npath);
        const editor = await VSCodeUtils.openFileInEditor(uri);
        this.L.info({ ctx, opts, msg: "exit" });
        if (opts.anchor && editor) {
          const text = editor.document.getText();
          const pos = findHeaderPos({ anchor: opts.anchor.value, text });
          editor.selection = new Selection(pos, pos);
          editor.revealRange(editor.selection);
        }
        return { note, pos };
      }
    );
    return out;
  }
}
