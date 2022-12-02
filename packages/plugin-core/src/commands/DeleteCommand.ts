import {
  DeleteNoteResp,
  DendronError,
  DLink,
  DNodeUtils,
  DVault,
  ERROR_SEVERITY,
  NotePropsMeta,
  Position,
  SchemaUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import { RemarkUtils } from "@dendronhq/unified";
import fs from "fs-extra";
import _ from "lodash";
import _md from "markdown-it";
import path from "path";
import { TextEditor, ViewColumn, window } from "vscode";
import { DendronClientUtilsV2 } from "../clientUtils";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { DENDRON_COMMANDS } from "../constants";
import { ExtensionProvider } from "../ExtensionProvider";
import { Logger } from "../logger";
import { IEngineAPIService } from "../services/EngineAPIServiceInterface";
import { AnalyticsUtils } from "../utils/analytics";
import { VSCodeUtils } from "../vsCodeUtils";
import { InputArgCommand } from "./base";

type CommandOpts = any;

type CommandOutput = DeleteNoteResp | void;
export type { CommandOutput as DeleteNodeCommandOutput };

function formatDeletedMsg({
  fsPath,
  vault,
}: {
  fsPath: string;
  vault: DVault;
}) {
  return `${path.basename(fsPath)} (${VaultUtils.getName(vault)}) deleted`;
}

export class DeleteCommand extends InputArgCommand<CommandOpts, CommandOutput> {
  key = DENDRON_COMMANDS.DELETE.key;

  private getBacklinkFrontmatterLineOffset(opts: {
    link: DLink;
    vaults: DVault[];
    wsRoot: string;
  }) {
    const { link, vaults, wsRoot } = opts;
    if (!link.from.fname || !link.from.vaultName) {
      throw new DendronError({
        message: `Link from location does not contain fname or vaultName: ${link.from}`,
        severity: ERROR_SEVERITY.MINOR,
      });
    }
    const vault = VaultUtils.getVaultByName({
      vaults,
      vname: link.from.vaultName,
    }) as DVault;

    const fsPath = DNodeUtils.getFullPath({
      wsRoot,
      vault,
      basename: link.from.fname + ".md",
    });
    const fileContent = fs.readFileSync(fsPath).toString();
    const nodePosition = RemarkUtils.getNodePositionPastFrontmatter(
      fileContent
    ) as Position;

    return nodePosition?.end.line;
  }
  /**
   * When Delete Command is ran from explorer menu, it gets Uri as args
   */
  private isUriArgs(opts: CommandOpts) {
    return !_.isEmpty(opts) && opts.fsPath;
  }

  private async deleteNote(params: {
    note: NotePropsMeta;
    opts: CommandOpts;
    engine: IEngineAPIService;
    ctx: string;
  }) {
    const { note, opts, engine, ctx } = params;
    const backlinks = note.links.filter((link) => link.type === "backlink");
    let title;
    if (backlinks.length === 0) {
      // no need to show preview a simple
      title = `Delete note ${note.fname}?`;
    } else {
      await this.showNoteDeletePreview(note, backlinks);
      title = `${note.fname} has backlinks. Delete note?`;
    }

    const shouldProceed = await this.promptConfirmation(title, opts?.noConfirm);
    if (!shouldProceed) {
      window.showInformationMessage("Cancelled");
      return;
    }

    // If Delete note preview is open, close it first
    if (backlinks.length !== 0) {
      await VSCodeUtils.closeCurrentFileEditor();
    }

    const out = await engine.deleteNote(note.id);
    if (out.error) {
      Logger.error({ ctx, msg: "error deleting node", error: out.error });
      return;
    }
    window.showInformationMessage(
      formatDeletedMsg({ fsPath: note.fname, vault: note.vault })
    );
    await VSCodeUtils.closeCurrentFileEditor();
    return out;
  }

  async showNoteDeletePreview(note: NotePropsMeta, backlinks: DLink[]) {
    let content = [
      "# Delete Node Preview",
      "```",
      `node type: note`,
      "",
      `# of backlinks to this note: ${backlinks.length}`,
      "```",
      "## Broken links after deletion",
      `These links will be broken after deleting **${note.fname}**`,
      "",
      `Make sure to convert the broken links listed below accordingly.`,
      "",
    ];

    const { wsRoot, engine } = ExtensionProvider.getDWorkspace();
    const { vaults } = engine;

    _.forEach(_.sortBy(backlinks, ["from.vaultName"]), (backlink) => {
      const fmLineOffset = this.getBacklinkFrontmatterLineOffset({
        link: backlink,
        vaults,
        wsRoot,
      });
      const entry = [
        `- in **${backlink.from.vaultName}/${backlink.from.fname}**`,
        `  - line *${backlink.position!.start.line + fmLineOffset}* column *${
          backlink.position?.start.column
        }*`,
        `  - alias: \`${backlink.alias ? backlink.alias : "None"}\``,
      ].join("\n");
      content = content.concat(entry);
    });

    const panel = window.createWebviewPanel(
      "deleteNodeNoteDeletePreview",
      "Note Delete Preview",
      ViewColumn.One,
      {}
    );
    panel.webview.html = _md().render(content.join("\n"));
    return content.join("\n");
  }

  async promptConfirmation(title: string, noConfirm?: boolean) {
    if (noConfirm) return true;
    const options = ["Proceed", "Cancel"];
    const resp = await VSCodeUtils.showQuickPick(options, {
      title,
      placeHolder: "Proceed",
      ignoreFocusOut: true,
    });
    return resp === "Proceed";
  }

  async sanityCheck(opts?: CommandOpts) {
    if (_.isUndefined(VSCodeUtils.getActiveTextEditor()) && _.isEmpty(opts)) {
      return "No note currently open, and no note selected to open.";
    }
    return;
  }

  async execute(opts?: CommandOpts): Promise<CommandOutput> {
    const engine = ExtensionProvider.getEngine();
    const ctx = "DeleteNoteCommand";
    if (_.isString(opts)) {
      AnalyticsUtils.track(this.key, { source: "TreeView" });
      const response = await engine.getNoteMeta(opts);
      if (response.error) {
        throw new DendronError({
          message: `Cannot find note with id: ${opts}`,
          payload: response.error,
          severity: ERROR_SEVERITY.MINOR,
        });
      }
      const out = await this.deleteNote({
        note: response.data,
        opts,
        engine,
        ctx,
      });
      return out;
    } else {
      const editor = VSCodeUtils.getActiveTextEditor() as TextEditor;
      const fsPath = this.isUriArgs(opts)
        ? opts.fsPath
        : VSCodeUtils.getFsPathFromTextEditor(editor);
      const mode = fsPath.endsWith(".md") ? "note" : "schema";
      const trimEnd = mode === "note" ? ".md" : ".schema.yml";
      const fname = path.basename(fsPath, trimEnd);
      if (mode === "note") {
        const vault = await PickerUtilsV2.getVaultForOpenEditor(fsPath);
        const note = (await engine.findNotesMeta({ fname, vault }))[0];
        const out = await this.deleteNote({ note, opts, engine, ctx });
        return out;
      } else {
        const smod = await DendronClientUtilsV2.getSchemaModByFname({
          fname,
          client: engine,
        });
        await engine.deleteSchema(SchemaUtils.getModuleRoot(smod).id);
        window.showInformationMessage(
          formatDeletedMsg({ fsPath, vault: smod.vault })
        );
        await VSCodeUtils.closeCurrentFileEditor();
        return;
      }
    }
  }
}
