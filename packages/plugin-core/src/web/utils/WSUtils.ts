import {
  DendronError,
  DVault,
  IntermediateDendronConfig,
  normalizeUnixPath,
  NoteProps,
  VaultUtils,
  type ReducedDEngine,
} from "@dendronhq/common-all";
import _ from "lodash";
import { inject, injectable } from "tsyringe";
import vscode from "vscode";
import { URI, Utils } from "vscode-uri";
import { SiteUtilsWeb } from "./site";

@injectable()
export class WSUtilsWeb {
  constructor(
    @inject("ReducedDEngine")
    private engine: ReducedDEngine,
    @inject("wsRoot") private wsRoot: URI,
    @inject("vaults") private vaults: DVault[]
  ) {}

  getVaultFromDocument(document: vscode.TextDocument) {
    const txtPath = document.uri.fsPath;
    const vault = VaultUtils.getVaultByFilePath({
      wsRoot: normalizeUnixPath(this.wsRoot.fsPath),
      vaults: this.vaults,
      fsPath: normalizeUnixPath(txtPath),
    });
    return vault;
  }

  public getNoteFromDocument(document: vscode.TextDocument) {
    const txtPath = document.uri.fsPath;
    const fname = path.basename(txtPath, ".md");
    let vault: DVault;
    try {
      vault = this.getVaultFromDocument(document);
    } catch (err) {
      // No vault
      return undefined;
    }

    return this.engine.findNotes({
      fname,
      vault,
    });
  }

  public async getActiveNote(): Promise<NoteProps | undefined> {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      return undefined;
    }

    const notes = await this.getNoteFromDocument(editor.document);

    if (!notes || notes.length !== 1) {
      return undefined;
    }

    return notes[0];
  }

  /**
   * Generate url for given note or return `undefined` if no url is specified
   * @param opts
   *
   */
  getNoteUrl(opts: {
    config: IntermediateDendronConfig;
    note: NoteProps;
    vault: DVault;
    urlRoot?: string;
  }) {
    const { config, note, vault } = opts;
    /**
     * set to true if index node, don't append id at the end
     */
    const { url: root, index } = SiteUtilsWeb.getSiteUrlRootForVault({
      vault,
      config,
    });
    if (!root) {
      throw new DendronError({ message: "no urlRoot set" });
    }
    // if we have a note, see if we are at index
    const isIndex: boolean = _.isUndefined(note)
      ? false
      : SiteUtilsWeb.isIndexNote({
          indexNote: index,
          note,
        });
    const pathValue = note.id;
    const siteUrlPath = SiteUtilsWeb.getSiteUrlPathForNote({
      addPrefix: true,
      pathValue,
      config,
    });

    const link = isIndex ? root : [root, siteUrlPath].join("");
    return link;
  }
}
