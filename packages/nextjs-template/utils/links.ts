import { DendronSiteConfig, NoteProps } from "@dendronhq/common-all";
import _ from "lodash";

export function getNoteUrl(opts: { note: NoteProps; id: NoteProps["id"] }) {
  const { note, id } = opts;
  return note.id === id ? "/" : `/notes/${note.id}`;
}

export function getAssetUrl(url: string) {
  const out =
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PUBLIC_ASSET_PREFIX
      ? process.env.NEXT_PUBLIC_ASSET_PREFIX + url
      : url;
  return out;
}

/**
 * Returns root url of page
 * @param url
 * @returns
 */
export function getRootUrl(siteConfig: DendronSiteConfig) {
  const url = siteConfig.siteUrl!;
  const out =
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PUBLIC_ASSET_PREFIX
      ? url + process.env.NEXT_PUBLIC_ASSET_PREFIX
      : url;
  return out;
}
