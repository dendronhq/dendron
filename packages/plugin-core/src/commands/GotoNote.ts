import {
  assertUnreachable,
  Awaited,
  BacklinkUtils,
  ConfigUtils,
  DNoteAnchorBasic,
  getSlugger,
  InvalidFilenameReason,
  NoteProps,
  NotePropsMeta,
  NoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import {
  FileExtensionUtils,
  findNonNoteFile,
  TemplateUtils,
} from "@dendronhq/common-server";
import _ from "lodash";
import path from "path";
import { Position, Selection, Uri, window } from "vscode";
import { VaultSelectionMode } from "../components/lookup/types";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { DENDRON_COMMANDS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { getAnalyticsPayload } from "../utils/analytics";
import { EditorUtils } from "../utils/EditorUtils";
import { PluginFileUtils } from "../utils/files";
import { maybeSendMeetingNoteTelemetry } from "../utils/MeetingTelemHelper";
import { VSCodeUtils } from "../vsCodeUtils";
import { WSUtilsV2 } from "../WSUtilsV2";
import { IWSUtilsV2 } from "../WSUtilsV2Interface";
import { BasicCommand } from "./base";
import {
  GotoFileType,
  GoToNoteCommandOpts,
  GoToNoteCommandOutput,
  TargetKind,
} from "./GoToNoteInterface";

export const findAnchorPos = (opts: {
  anchor: DNoteAnchorBasic;
  note: NotePropsMeta;
}): Position => {
  const { anchor: findAnchor, note } = opts;
  let key: string;
  switch (findAnchor.type) {
    case "line":
      return new Position(findAnchor.line - 1, 0);
    case "block":
      key = `^${findAnchor.value}`;
      break;
    case "header":
      key = getSlugger().slug(findAnchor.value);
      break;
    default:
      assertUnreachable(findAnchor);
  }

  const found = note.anchors[key];

  if (_.isUndefined(found)) return new Position(0, 0);
  return new Position(found.line, found.column);
};

type FoundLinkSelection = NonNullable<
  Awaited<ReturnType<typeof EditorUtils.getLinkFromSelectionWithWorkspace>>
>;

/**
 * Open or create a note. See {@link GotoNoteCommand.execute} for details
 */
export class GotoNoteCommand extends BasicCommand<
  GoToNoteCommandOpts,
  GoToNoteCommandOutput
> {
  key = DENDRON_COMMANDS.GOTO_NOTE.key;
  private extension: IDendronExtension;
  private wsUtils: IWSUtilsV2;

  constructor(extension: IDendronExtension) {
    super();
    this.extension = extension;
    this.wsUtils = extension.wsUtils;
  }

  private async getQs(
    opts: GoToNoteCommandOpts,
    link: FoundLinkSelection
  ): Promise<GoToNoteCommandOpts> {
    if (link.value) {
      // Reference to another file
      opts.qs = link.value;
    } else {
      // Same file block reference, implicitly current file
      const note = await this.wsUtils.getActiveNote();
      if (note) {
        // Same file link within note
        opts.qs = note.fname;
        opts.vault = note.vault;
      } else {
        const { wsRoot, vaults } = this.extension.getEngine();
        // Same file link within non-note file
        opts.qs = path.relative(
          wsRoot,
          VSCodeUtils.getActiveTextEditorOrThrow().document.fileName
        );
        opts.vault = VaultUtils.getVaultByFilePath({
          wsRoot,
          vaults,
          fsPath: opts.qs,
        });
      }
    }
    return opts;
  }

  private async maybeSetOptsFromExistingNote(opts: GoToNoteCommandOpts) {
    const engine = this.extension.getEngine();
    const notes = (await engine.findNotesMeta({ fname: opts.qs })).filter(
      (note) => !note.id.startsWith(NoteUtils.FAKE_ID_PREFIX)
    );
    if (notes.length === 1) {
      // There's just one note, so that's the one we'll go with.
      opts.vault = notes[0].vault;
    } else if (notes.length > 1) {
      // It's ambiguous which note the user wants to go to, so we have to
      // guess or prompt.
      const resp = await PickerUtilsV2.promptVault(
        notes.map((ent) => ent.vault)
      );
      if (_.isUndefined(resp)) return null;
      opts.vault = resp;
    }
    // Not an existing note
    return opts;
  }

  private async maybeSetOptsFromNonNote(opts: GoToNoteCommandOpts) {
    const { vaults, wsRoot } = this.extension.getEngine();
    const nonNote = await findNonNoteFile({
      fpath: opts.qs!,
      wsRoot,
      vaults,
    });
    if (nonNote) {
      opts.qs = nonNote.fullPath;
      opts.kind = TargetKind.NON_NOTE;
    }
    return opts;
  }

  private async setOptsFromNewNote(opts: GoToNoteCommandOpts) {
    // Depending on the config, we can either
    // automatically pick the vault or we'll prompt for it.
    const config = await this.extension.getDWorkspace().config;
    const confirmVaultSetting =
      ConfigUtils.getLookup(config).note.confirmVaultOnCreate;

    const selectionMode =
      confirmVaultSetting !== true
        ? VaultSelectionMode.smart
        : VaultSelectionMode.alwaysPrompt;

    const currentVault = await PickerUtilsV2.getVaultForOpenEditor();
    const selectedVault = await PickerUtilsV2.getOrPromptVaultForNewNote({
      vault: currentVault,
      fname: opts.qs!,
      vaultSelectionMode: selectionMode,
    });

    // If we prompted the user and they selected nothing, then they want to cancel
    if (_.isUndefined(selectedVault)) {
      return null;
    }
    opts.vault = selectedVault;

    // this is needed to populate the new note's backlink after it is created
    opts.originNote = await this.wsUtils.getActiveNote();
    return opts;
  }

  private async processInputs(opts: GoToNoteCommandOpts) {
    if (opts.qs && opts.vault) return opts;

    if (opts.qs && !opts.vault) {
      // Special case: some code expects GotoNote to default to current vault if qs is provided but vault isn't
      opts.vault = await PickerUtilsV2.getVaultForOpenEditor();
      return opts;
    }

    const link = await EditorUtils.getLinkFromSelectionWithWorkspace();
    if (!link) {
      window.showErrorMessage("selection is not a valid link");
      return null;
    }

    // Get missing opts from the selected link, if possible
    if (!opts.qs) opts = await this.getQs(opts, link);
    if (!opts.vault && link.vaultName)
      opts.vault = VaultUtils.getVaultByNameOrThrow({
        vaults: await this.extension.getDWorkspace().vaults,
        vname: link.vaultName,
      });
    if (!opts.anchor && link.anchorHeader) opts.anchor = link.anchorHeader;

    // If vault is missing, then we haven't found the note yet. Go through possible options until we find it.
    if (opts.vault === undefined) {
      const existingNote = await this.maybeSetOptsFromExistingNote(opts);
      // User cancelled prompt
      if (existingNote === null) return null;
      opts = existingNote;
    }
    if (opts.vault === undefined) {
      opts = await this.maybeSetOptsFromNonNote(opts);
    }
    // vault undefined and we're not targeting a {@link TargetKind.NON_NOTE}
    if (opts.vault === undefined && opts.kind !== TargetKind.NON_NOTE) {
      const newNote = await this.setOptsFromNewNote(opts);
      // User cancelled prompt
      if (newNote === null) return null;
      opts = newNote;
    }

    return opts;
  }

  /**
   *
   * Warning about `opts`! If `opts.qs` is provided but `opts.vault` is empty,
   * it will default to the current vault. If `opts.qs` is not provided, it will
   * read the selection from the current document as a link to get it. If both
   * `opts.qs` and `opts.vault` is empty, both will be read from the selected link.
   *
   * @param opts.qs - query string. should correspond to {@link NoteProps.fname}
   * @param opts.vault - {@link DVault} for note
   * @param opts.anchor - a {@link DNoteAnchor} to navigate to
   * @returns
   */
  async execute(opts: GoToNoteCommandOpts): Promise<GoToNoteCommandOutput> {
    const ctx = "GotoNoteCommand";
    this.L.info({ ctx, opts, msg: "enter" });
    const { overrides } = opts;
    const client = this.extension.getEngine();
    const { wsRoot } = this.extension.getDWorkspace();

    const processedOpts = await this.processInputs(opts);
    if (processedOpts === null) return; // User cancelled a prompt, or did not have a valid link selected
    const { qs, vault } = processedOpts;

    // Non-note files use `qs` for full path, and set vault to null
    if (opts.kind === TargetKind.NON_NOTE && qs) {
      let type: GotoFileType;
      if (FileExtensionUtils.isTextFileExtension(path.extname(qs))) {
        // Text file, open inside of VSCode
        type = GotoFileType.TEXT;
        const editor = await VSCodeUtils.openFileInEditor(
          Uri.from({ scheme: "file", path: qs }),
          {
            column: opts.column,
          }
        );
        if (editor && opts.anchor) {
          await this.extension.wsUtils.trySelectRevealNonNoteAnchor(
            editor,
            opts.anchor
          );
        }
      } else {
        // Binary file, open with default app
        type = GotoFileType.BINARY;
        await PluginFileUtils.openWithDefaultApp(qs);
      }

      return {
        kind: TargetKind.NON_NOTE,
        type,
        fullPath: qs,
      };
    }

    if (qs === undefined || vault === undefined) {
      // There was an error or the user cancelled a prompt
      return;
    }

    // Otherwise, it's a regular note
    let pos: undefined | Position;
    const out = await this.extension.pauseWatchers<GoToNoteCommandOutput>(
      async () => {
        const notes = await client.findNotes({ fname: qs, vault });
        let note: NoteProps;

        // If note doesn't exist, create note with schema
        if (notes.length === 0) {
          const fname = qs;
          // validate fname before creating new note
          const validationResp = NoteUtils.validateFname(fname);
          if (validationResp.isValid) {
            const newNote = await NoteUtils.createWithSchema({
              noteOpts: {
                fname,
                vault,
              },
              engine: client,
            });
            await TemplateUtils.findAndApplyTemplate({
              note: newNote,
              engine: client,
              pickNote: async (choices: NoteProps[]) => {
                return WSUtilsV2.instance().promptForNoteAsync({
                  notes: choices,
                  quickpickTitle:
                    "Select which template to apply or press [ESC] to not apply a template",
                  nonStubOnly: true,
                });
              },
            });
            note = _.merge(newNote, overrides || {});
            const { originNote } = opts;
            if (originNote) {
              this.addBacklinkPointingToOrigin({
                originNote,
                note,
              });
            }
            await client.writeNote(note);

            // check if we should send meeting note telemetry.
            const type = qs.startsWith("user.") ? "userTag" : "general";
            maybeSendMeetingNoteTelemetry(type);
          } else {
            // should not create note if fname is invalid.
            // let the user know and exit early.
            this.displayInvalidFilenameError({ fname, validationResp });
            return;
          }
        } else {
          note = notes[0];
          // If note exists and its a stub note, delete stub and create new note
          if (note.stub) {
            delete note.stub;
            note = _.merge(note, overrides || {});
            await client.writeNote(note);
          }
        }

        const npath = NoteUtils.getFullPath({
          note,
          wsRoot,
        });
        const uri = Uri.file(npath);
        const editor = await VSCodeUtils.openFileInEditor(uri, {
          column: opts.column,
        });
        this.L.info({ ctx, opts, msg: "exit" });
        if (opts.anchor && editor) {
          pos = findAnchorPos({ anchor: opts.anchor, note });
          editor.selection = new Selection(pos, pos);
          editor.revealRange(editor.selection);
        }
        return { kind: TargetKind.NOTE, note, pos, source: opts.source };
      }
    );
    return out;
  }

  addAnalyticsPayload(
    opts?: GoToNoteCommandOpts,
    resp?: GoToNoteCommandOutput
  ) {
    const { source, type } = {
      type: undefined,
      ...opts,
      ...resp,
    };
    const payload = { ...getAnalyticsPayload(source), fileType: type };
    return payload;
  }

  private displayInvalidFilenameError(opts: {
    fname: string;
    validationResp: {
      isValid: boolean;
      reason: InvalidFilenameReason;
    };
  }) {
    const { fname, validationResp } = opts;
    const message = `Cannot create note ${fname}: ${validationResp.reason}`;
    window.showErrorMessage(message);
  }

  /**
   * Given an origin note and a newly created note,
   * add a backlink that points to the origin note
   * to newly created note's link metadata
   */
  private addBacklinkPointingToOrigin(opts: {
    originNote: NoteProps;
    note: NoteProps;
  }) {
    const { originNote, note } = opts;
    const originLinks = originNote.links;

    const linkToNote = originLinks.find(
      (link) => link.to?.fname === note.fname
    );
    if (linkToNote) {
      const backlinkToOrigin = BacklinkUtils.createFromDLink(linkToNote);
      if (backlinkToOrigin) note.links.push(backlinkToOrigin);
    }
  }
}
