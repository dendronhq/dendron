import { ConfigUtils, NotePropsMeta, NoteUtils } from "@dendronhq/common-all";
import _ from "lodash";
import { window } from "vscode";
import { DendronClientUtilsV2 } from "../clientUtils";
import { DENDRON_COMMANDS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { VSCodeUtils } from "../vsCodeUtils";
import { WSUtils } from "../WSUtils";
import { BasicCommand } from "./base";

type CommandOpts = {
  /*
   * optional flag that will wrap the index block with markers.
   */
  marker?: boolean;
};

type CommandOutput = CommandOpts;

export class InsertNoteIndexCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.INSERT_NOTE_INDEX.key;
  private extension: IDendronExtension;

  constructor(ext: IDendronExtension) {
    super();
    this.extension = ext;
  }

  // TODO: make this into a util once the cli version is implemented.
  // NOTE: the marker flag is not exposed to the plugin yet.
  genNoteIndex(
    notes: NotePropsMeta[],
    opts: {
      marker?: boolean;
    }
  ) {
    const listItems = notes.map((note) => {
      const link = NoteUtils.createWikiLink({
        note,
        useVaultPrefix: DendronClientUtilsV2.shouldUseVaultPrefix(
          this.extension.getEngine()
        ),
        alias: { mode: "title" },
      });
      return `- ${link}`;
    });
    let payload = ["## Index", listItems.join("\n")];
    if (opts.marker) {
      payload = [
        "<!-- Autogenerated Index Start -->",
        ...payload,
        "<!-- Autogenerated Index End -->",
      ];
    }
    return payload.join("\n");
  }

  async execute(opts: CommandOpts) {
    const ctx = "InsertNoteIndexCommand";
    this.L.info({ ctx, msg: "execute", opts });
    const maybeEditor = VSCodeUtils.getActiveTextEditor()!;
    if (_.isUndefined(maybeEditor)) {
      window.showErrorMessage(
        "No active text editor found. Try running this command in a Dendron note."
      );
      return opts;
    }
    const activeNote = await WSUtils.getNoteFromDocument(maybeEditor.document)!;
    if (_.isUndefined(activeNote)) {
      window.showErrorMessage("Active file is not a Dendron note.");
      return opts;
    }
    const engine = this.extension.getEngine();
    const bulkResp = await engine.bulkGetNotesMeta(activeNote.children);
    const children = bulkResp.data;
    if (children.length === 0) {
      window.showInformationMessage("This note does not have any child notes.");
      return opts;
    }
    const { config } = this.extension.getDWorkspace();

    const insertNoteIndexConfig =
      ConfigUtils.getCommands(config).insertNoteIndex;
    const maybeMarker = insertNoteIndexConfig.enableMarker;

    const noteIndex = this.genNoteIndex(children, {
      marker: opts.marker ? opts.marker : maybeMarker,
    });
    const current = maybeEditor.selection;
    await maybeEditor.edit((builder) => {
      builder.insert(current.start, noteIndex);
    });
    return opts;
  }
}
