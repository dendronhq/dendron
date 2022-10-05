import {
  DendronError,
  DVault,
  ERROR_STATUS,
  RespV3,
  VaultUtils,
} from "@dendronhq/common-all";
import { resolvePath, vault2Path } from "@dendronhq/common-server";
import fs from "fs";
import _ from "lodash";
import open from "open";
import path from "path";
import { env, Uri } from "vscode";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { DENDRON_COMMANDS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { ExtensionProvider } from "../ExtensionProvider";
import { EditorUtils } from "../utils/EditorUtils";
import { getURLAt } from "../utils/md";
import { VSCodeUtils } from "../vsCodeUtils";
import { getExtension } from "../workspace";
import { BasicCommand } from "./base";
import { GotoNoteCommand } from "./GotoNote";
import { GoToNoteCommandOutput, TargetKind } from "./GoToNoteInterface";
import { OpenLinkCommand } from "./OpenLink";

type CommandOpts = {};

type CommandOutput = RespV3<GoToNoteCommandOutput>;

const GOTO_KEY = "uri";

/**
 * Go to the current link under cursor. This command will exhibit different behavior depending on the type of the link.
 * See [[dendron.ref.commands.goto]] for more details
 */
export class GotoCommand extends BasicCommand<CommandOpts, CommandOutput> {
  key = DENDRON_COMMANDS.GOTO.key;

  constructor(private _ext: IDendronExtension) {
    super();
  }

  addAnalyticsPayload(
    _opts?: CommandOpts,
    out?: RespV3<GoToNoteCommandOutput>
  ) {
    if (!out?.data) {
      return {};
    }
    const kind = out.data.kind;
    // non-note file has file type
    if (out.data.kind === TargetKind.NON_NOTE) {
      return {
        kind,
        type: out.data.type,
      };
    }
    return { kind };
  }

  async execute(): Promise<CommandOutput> {
    const externalLink = getURLAt(VSCodeUtils.getActiveTextEditor());
    const noteLink = await EditorUtils.getLinkFromSelectionWithWorkspace();

    /* If the link read is not a valid link, exit from the command with a message */
    if (!externalLink && !noteLink) {
      const error = DendronError.createFromStatus({
        status: ERROR_STATUS.INVALID_STATE,
        message: `no valid path or URL selected`,
      });
      this.L.error({ error });
      return { error };
    }

    /* Depending on the link type selected, execute different command logic */
    if (noteLink) {
      return this.goToNoteLink(noteLink);
    } else {
      return this.goToExternalLink(externalLink);
    }
  }

  private async goToNoteLink(noteLink: any): Promise<CommandOutput> {
    const { vaults, engine } = ExtensionProvider.getDWorkspace();

    // get vault
    let vault: DVault | undefined;
    const { anchorHeader, value: fname, vaultName } = noteLink!;
    if (vaultName) {
      vault = VaultUtils.getVaultByNameOrThrow({
        vaults,
        vname: vaultName,
      });
    }

    // get note
    const notes = await engine.findNotesMeta({ fname, vault });
    if (notes.length === 0) {
      return {
        error: new DendronError({ message: "selection is not a note" }),
      };
    }

    // TODO: for now, get first note, in the future, show prompt
    const note = notes[0];

    // if note doesn't have url, run goto note command
    if (_.isUndefined(note.custom?.[GOTO_KEY])) {
      const resp = await new GotoNoteCommand(this._ext).execute({
        qs: note.fname,
        vault: note.vault,
        anchor: anchorHeader,
      });
      return { data: resp };
    }

    await this.openLink(note.custom[GOTO_KEY]);
    // we found a link
    return {
      data: {
        kind: TargetKind.LINK,
        fullPath: note.custom[GOTO_KEY],
        fromProxy: true,
      },
    };
  }

  private async goToExternalLink(externalLink: string): Promise<CommandOutput> {
    let assetPath: string;

    if (
      externalLink.indexOf(":/") !== -1 ||
      externalLink.indexOf("/") === 0 ||
      externalLink.indexOf(":\\") !== -1
    ) {
      env.openExternal(Uri.parse(externalLink.replace("\\", "/"))); // make sure vscode doesn't choke on "\"s
      assetPath = externalLink;
    } else {
      const { wsRoot } = this._ext.getDWorkspace();

      if (externalLink.startsWith("asset")) {
        const vault = PickerUtilsV2.getOrPromptVaultForOpenEditor();
        assetPath = path.join(vault2Path({ vault, wsRoot }), externalLink);
      } else {
        assetPath = resolvePath(
          externalLink,
          getExtension().rootWorkspace.uri.fsPath
        );
      }
      if (!fs.existsSync(assetPath)) {
        const error = DendronError.createFromStatus({
          status: ERROR_STATUS.INVALID_STATE,
          message: `no valid path or URL selected`,
        });
        this.L.error({ error });
        return { error };
      }
      await open(assetPath).catch((err) => {
        const error = DendronError.createFromStatus({
          status: ERROR_STATUS.UNKNOWN,
          innerError: err,
        });
        this.L.error({ error });
        return { error };
      });
    }
    return {
      data: { kind: TargetKind.LINK, fullPath: assetPath, fromProxy: false },
    };
  }

  private openLink(uri: string) {
    return new OpenLinkCommand().execute({ uri });
  }
}
