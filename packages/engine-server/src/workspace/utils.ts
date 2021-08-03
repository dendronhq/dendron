import { DendronConfig, DNodeUtils, DVault, getSlugger, isBlockAnchor, NoteProps, VaultUtils, WorkspaceOpts } from "@dendronhq/common-all";
import { findUpTo, genHash } from "@dendronhq/common-server";
import _ from "lodash";

export class WorkspaceUtils {
  /**
   * Find wsRoot if exists
   * @returns
   */
  static findWSRoot() {
    const cwd = process.cwd();
    const configPath = findUpTo({
      base: cwd,
      fname: "dendron.yml",
      maxLvl: 3,
      returnDirPath: true,
    });
    return configPath;
  }

  /**
   * Check if path is in workspace
   * @returns
   */
  static isPathInWorkspace({
    wsRoot,
    vaults,
    fpath,
  }: { fpath: string } & WorkspaceOpts) {
    try {
      VaultUtils.getVaultByNotePath({
        vaults,
        wsRoot,
        fsPath: fpath,
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Return true if contents of note is different from engine
   * @param param0
   * @returns
   */
  static noteContentChanged({
    content,
    note,
  }: {
    content: string;
    note: NoteProps;
  }) {
    const noteHash = genHash(content);
    if (_.isUndefined(note.contentHash)) {
      return true;
    }
    return noteHash !== note.contentHash;
  }

/**
 * Generate url for given note or return `undefined` if no url is specified
 * @param opts 
 *
 */
  static getNoteUrl(opts: {config: DendronConfig, note: NoteProps, vault: DVault, urlRoot?: string, maybeNote?: NoteProps, anchor?: string}){
  
    const {config, note, anchor, vault, maybeNote} = opts;
    let urlRoot = opts.urlRoot;
    const notePrefix = "notes";
     /**
     * set to true if index node, don't append id at the end
     */
    let isIndex: boolean = false;

    if (vault.seed) {
      if (config.seeds && config.seeds[vault.seed]) {
        const maybeSite = config.seeds[vault.seed]?.site;
        if (maybeSite) {
          urlRoot = maybeSite.url;
          if (!_.isUndefined(maybeNote)) {
            // if custom index is set, match against that, otherwise `root` is default index
            isIndex = maybeSite.index
              ? maybeNote.fname === maybeSite.index
              : DNodeUtils.isRoot(maybeNote);
          }
        }
      }
    }
    let root = "";
    if (!_.isUndefined(urlRoot)) {
      root = urlRoot;
    } else {
      // assume github
      throw Error("not implemented");
    }
    let link = isIndex ? root : [root, notePrefix, note.id + ".html"].join("/");

    if (anchor) {
      if (!isBlockAnchor(anchor)) {
        link += `#${getSlugger().slug(anchor)}`;
      } else {
        link += `#${anchor}`;
      }
    }
  return link;
  }
}
