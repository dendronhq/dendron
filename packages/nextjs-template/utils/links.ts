import {
  DendronSiteConfig,
  DendronPublishingConfig,
  NoteProps,
} from "@dendronhq/common-all";
import _ from "lodash";
import { env } from "../env/client";

export function getNoteUrl(opts: { note: NoteProps; noteIndex: NoteProps }) {
  const { note, noteIndex } = opts;
  return note.id === noteIndex.id ? "/" : `/notes/${note.id}`;
}

export function getAssetUrl(url: string) {
  const out =
    process.env.NODE_ENV !== "development" && env.NEXT_PUBLIC_ASSET_PREFIX
      ? env.NEXT_PUBLIC_ASSET_PREFIX + url
      : url;
  return out;
}

/**
 * Returns root url of page
 * @param url
 * @returns
 */
export function getRootUrl(
  siteConfig: DendronSiteConfig | DendronPublishingConfig
) {
  const url = siteConfig.siteUrl!;
  const out =
    process.env.NODE_ENV !== "development" &&
    process.env.NEXT_PUBLIC_ASSET_PREFIX
      ? url + process.env.NEXT_PUBLIC_ASSET_PREFIX
      : url;
  return out;
}
