import {
  ConfigUtils,
  DNodeUtils,
  DVault,
  IntermediateDendronConfig,
  NoteProps,
} from "@dendronhq/common-all";
import _ from "lodash";

export class SiteUtilsWeb {
  static getSiteUrlRootForVault({
    vault,
    config,
  }: {
    vault: DVault;
    config: IntermediateDendronConfig;
  }): { url?: string; index?: string } {
    if (vault.seed) {
      const seeds = ConfigUtils.getWorkspace(config).seeds;
      if (seeds && seeds[vault.seed]) {
        const maybeSite = seeds[vault.seed]?.site;
        if (maybeSite) {
          return { url: maybeSite.url, index: maybeSite.index };
        }
      }
    }
    if (vault.siteUrl) {
      return { url: vault.siteUrl, index: vault.siteIndex };
    }
    const { siteUrl, siteIndex } = ConfigUtils.getPublishingConfig(config);
    return { url: siteUrl, index: siteIndex };
  }

  static getSitePrefixForNote(config: IntermediateDendronConfig) {
    const assetsPrefix = ConfigUtils.getAssetsPrefix(config);
    return assetsPrefix ? assetsPrefix + "/notes/" : "/notes/";
  }

  /**
   * Is the current note equivalent ot the index of the published site?
   * @returns
   */
  static isIndexNote({
    indexNote,
    note,
  }: {
    indexNote?: string;
    note: NoteProps;
  }): boolean {
    return indexNote ? note.fname === indexNote : DNodeUtils.isRoot(note);
  }

  static getSiteUrlPathForNote({
    pathValue,
    pathAnchor,
    config,
    addPrefix,
    note,
  }: {
    pathValue?: string;
    pathAnchor?: string;
    config: IntermediateDendronConfig;
    addPrefix?: boolean;
    note?: NoteProps;
  }): string {
    // add path prefix if valid
    let pathPrefix: string = "";
    if (addPrefix) {
      pathPrefix = this.getSitePrefixForNote(config);
    }

    // no prefix if we are at the index note
    const isIndex: boolean = _.isUndefined(note)
      ? false
      : this.isIndexNote({
          indexNote: config.publishing?.siteIndex,
          note,
        });
    if (isIndex) {
      return `/`;
    }
    // remove extension for pretty links
    const usePrettyLinks = ConfigUtils.getEnablePrettlyLinks(config);
    const pathExtension =
      _.isBoolean(usePrettyLinks) && usePrettyLinks ? "" : ".html";

    // put together the url path
    return `${pathPrefix || ""}${pathValue}${pathExtension}${
      pathAnchor ? "#" + pathAnchor : ""
    }`;
  }
}
