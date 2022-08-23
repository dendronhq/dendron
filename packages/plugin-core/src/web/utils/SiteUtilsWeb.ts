import {
  DendronError,
  DNodeUtils,
  DVault,
  NoteProps,
} from "@dendronhq/common-all";
import _ from "lodash";
import { inject, injectable } from "tsyringe";

@injectable()
export class SiteUtilsWeb {
  constructor(
    @inject("siteUrl") private siteUrl?: string,
    @inject("siteIndex") private siteIndex?: string,
    @inject("assetsPrefix") private assetsPrefix?: string,
    @inject("enablePrettyLinks") private enablePrettyLinks?: boolean
  ) {}

  getSiteUrlRootForVault({ vault }: { vault: DVault }): {
    url?: string;
    index?: string;
  } {
    if (vault.siteUrl) {
      return { url: vault.siteUrl, index: vault.siteIndex };
    }
    return { url: this.siteUrl, index: this.siteIndex };
  }

  /**
   * Is the current note equivalent ot the index of the published site?
   * @returns
   */
  isIndexNote({
    indexNote,
    note,
  }: {
    indexNote?: string;
    note: NoteProps;
  }): boolean {
    return indexNote ? note.fname === indexNote : DNodeUtils.isRoot(note);
  }

  getSiteUrlPathForNote({
    pathValue,
    pathAnchor,
    addPrefix,
    note,
  }: {
    pathValue?: string;
    pathAnchor?: string;
    addPrefix?: boolean;
    note?: NoteProps;
  }): string {
    // add path prefix if valid
    let pathPrefix: string = "";
    if (addPrefix) {
      pathPrefix = this.assetsPrefix
        ? this.assetsPrefix + "/notes/"
        : "/notes/";
    }

    // no prefix if we are at the index note
    const isIndex: boolean = _.isUndefined(note)
      ? false
      : this.isIndexNote({
          indexNote: this.siteIndex,
          note,
        });
    if (isIndex) {
      return `/`;
    }
    // remove extension for pretty links
    const usePrettyLinks = this.enablePrettyLinks;
    const pathExtension =
      _.isBoolean(usePrettyLinks) && usePrettyLinks ? "" : ".html";

    // put together the url path
    return `${pathPrefix || ""}${pathValue}${pathExtension}${
      pathAnchor ? "#" + pathAnchor : ""
    }`;
  }

  /**
   * Generate url for given note
   * @param opts
   *
   */
  getNoteUrl(opts: { note: NoteProps; vault: DVault }) {
    const { note, vault } = opts;
    /**
     * set to true if index node, don't append id at the end
     */
    const { url: root, index } = this.getSiteUrlRootForVault({
      vault,
    });
    if (!root) {
      throw new DendronError({
        message:
          "No siteUrl set. Please set a url root and reload workspace. Docs link: https://wiki.dendron.so/notes/ZDAEEzEeSW0xQsMBWLQp0",
      });
    }
    // if we have a note, see if we are at index
    const isIndex: boolean = _.isUndefined(note)
      ? false
      : this.isIndexNote({
          indexNote: index,
          note,
        });
    const pathValue = note.id;
    const siteUrlPath = this.getSiteUrlPathForNote({
      addPrefix: true,
      pathValue,
    });

    const link = isIndex ? root : [root, siteUrlPath].join("");
    return link;
  }
}
