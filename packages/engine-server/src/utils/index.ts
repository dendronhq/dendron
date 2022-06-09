import {
  CONSTANTS,
  DendronError,
  DNoteRefData,
  DNoteRefLink,
  getSlugger,
  NoteProps,
  NotePropsByIdDict,
  NotesCacheEntry,
} from "@dendronhq/common-all";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { WSMeta } from "../types";

export * from "./engineUtils";

function normalize(text: string) {
  return _.toLower(_.trim(text, " #"));
}

export function normalizev2(
  text: string,
  slugger: ReturnType<typeof getSlugger>
) {
  const u = _.trim(text, " #");
  if (u === "*") {
    return u;
  }
  return slugger.slug(u);
}

/**
 * take a ref link and parse it as regular markdown
 */
export function refLink2String(
  link: DNoteRefLink,
  opts?: { includeParen: boolean; includeRefTag?: boolean }
): string {
  const cleanOpts = _.defaults(opts, {
    includeParen: false,
    includeRefTag: false,
  });
  const { anchorStart, anchorStartOffset, anchorEnd } = link.data;
  const { fname: name } = link.from;
  // [[foo]]#head1:#*"
  const linkParts = [`[[${name}]]`];
  if (anchorStart) {
    linkParts.push(`#${normalize(anchorStart)}`);
  }
  if (anchorStartOffset) {
    linkParts.push(`,${anchorStartOffset}`);
  }
  if (anchorEnd) {
    linkParts.push(`:#${normalize(anchorEnd)}`);
  }
  if (cleanOpts.includeRefTag) {
    linkParts.splice(0, 0, "ref: ");
  }
  if (cleanOpts.includeParen) {
    linkParts.splice(0, 0, "((");
    linkParts.push("))");
  }
  return linkParts.join("");
}

export function refLink2Stringv2(opts: {
  link: DNoteRefLink;
  useVaultPrefix?: boolean;
  rawAnchors?: boolean;
}): string {
  const { link, useVaultPrefix, rawAnchors } = opts;
  const slugger = getSlugger();
  const { anchorStart, anchorStartOffset, anchorEnd } = link.data;
  const { fname: name } = link.from;
  // [[foo]]#head1:#*"

  const linkParts = [`![[`];
  if (useVaultPrefix) {
    linkParts.push(CONSTANTS.DENDRON_DELIMETER + link.from.vaultName! + "/");
  }
  linkParts.push(name);
  if (anchorStart) {
    if (rawAnchors) {
      linkParts.push(`#${anchorStart}`);
    } else {
      linkParts.push(`#${normalizev2(anchorStart, slugger)}`);
    }
  }
  if (anchorStartOffset) {
    linkParts.push(`,${anchorStartOffset}`);
  }
  if (anchorEnd) {
    if (rawAnchors) {
      linkParts.push(`:#${anchorEnd}`);
    } else {
      linkParts.push(`:#${normalizev2(anchorEnd, slugger)}`);
    }
  }
  linkParts.push("]]");
  return linkParts.join("");
}

export function getWSMetaFilePath({ wsRoot }: { wsRoot: string }) {
  const fsPath = path.join(wsRoot, CONSTANTS.DENDRON_WS_META);
  return fsPath;
}

export function openWSMetaFile({ fpath }: { fpath: string }): WSMeta {
  const wsMetaFileExists = fs.existsSync(fpath);
  if (wsMetaFileExists) {
    return fs.readJSONSync(fpath) as WSMeta;
  } else {
    fs.ensureFileSync(fpath);
    const defaultWSMeta: WSMeta = {
      version: "0.0.0",
      activationTime: 0,
    };
    writeWSMetaFile({ fpath, data: defaultWSMeta });
    return defaultWSMeta;
  }
}

export function writeWSMetaFile({
  fpath,
  data,
}: {
  fpath: string;
  data: WSMeta;
}) {
  return fs.writeJSONSync(fpath, data);
}

type LinkDirection = "from" | "to";

export function parseDendronRef(ref: string) {
  const [idOrRef, ...rest] = _.trim(ref).split(":");
  const cleanArgs = _.trim(rest.join(":"));
  let link: DNoteRefLink | undefined;
  let direction: LinkDirection;
  if (idOrRef === "ref") {
    direction = "to";
    link = parseLink(cleanArgs);
  } else {
    throw Error(`parse non ref not implemented, ref: ${ref}`);
  }
  return { direction, link };
}

export function parseFileLink(ref: string): DNoteRefLink {
  const wikiFileName = /([^\]:]+)/.source;
  const reLink = new RegExp(
    "" +
      /\[\[/.source +
      `(?<name>${wikiFileName})` +
      /\]\]/.source +
      `(${
        new RegExp(
          // anchor start
          "" +
            /#?/.source +
            `(?<anchorStart>${wikiFileName})` +
            // anchor stop
            `(:#(?<anchorEnd>${wikiFileName}))?`
        ).source
      })?`,
    "i"
  );
  const groups = reLink.exec(ref)?.groups;
  const clean: DNoteRefData = {
    type: "file",
  };
  let fname: string | undefined;
  _.each<Partial<DNoteRefData>>(groups, (v, k) => {
    if (_.isUndefined(v)) {
      return;
    }
    if (k === "name") {
      fname = path.basename(v as string, ".md");
    } else {
      // @ts-ignore
      clean[k] = v;
    }
  });
  if (_.isUndefined(fname)) {
    throw new DendronError({ message: `fname for ${ref} is undefined` });
  }
  if (clean.anchorStart && clean.anchorStart.indexOf(",") >= 0) {
    const [anchorStart, offset] = clean.anchorStart.split(",");
    clean.anchorStart = anchorStart;
    clean.anchorStartOffset = parseInt(offset, 10);
  }
  return { from: { fname }, data: clean, type: "ref" };
}

function parseLink(ref: string): DNoteRefLink | undefined {
  if (ref.indexOf("]") >= 0) {
    return parseFileLink(ref);
  } else {
    throw Error(`parseLink, non-file link, not implemented, ${ref}`);
  }
}

export const matchRefMarker = (txt: string) => {
  return txt.match(/\(\((?<ref>[^)]+)\)\)/);
};

export function createCacheEntry(opts: {
  noteProps: NoteProps;
  hash: string;
}): NotesCacheEntry {
  const { noteProps, hash } = opts;
  return {
    data: _.omit(noteProps, "body"),
    hash,
  };
}

export const getCachePath = (vpath: string): string => {
  return path.join(vpath, CONSTANTS.DENDRON_CACHE_FILE);
};

export const removeCache = (vpath: string) => {
  const cachePath = getCachePath(vpath);
  if (fs.pathExistsSync(getCachePath(cachePath))) {
    return fs.remove(cachePath);
  }
  return;
};

/**
 @deprecated - remove after version 0.76
 * @param doc 
 * @returns 
 */
export function stripLocalOnlyTags(doc: string) {
  const re = new RegExp(/(?<raw>.+<!--LOCAL_ONLY_LINE-->)/);
  let matches;
  do {
    matches = doc.match(re);
    if (matches) {
      // @ts-ignore
      const { raw, body } = matches.groups;
      doc = doc.replace(raw, "");
    }
  } while (matches);
  return doc;
}

export class HierarchyUtils {
  /**
   * Get children of current note
   * @param opts.skipLevels: how many levels to skip for child
   * @returns
   */
  static getChildren = (opts: {
    skipLevels: number;
    note: NoteProps;
    notes: NotePropsByIdDict;
  }) => {
    const { skipLevels, note, notes } = opts;
    let children = note.children
      .map((id) => notes[id])
      .filter((ent) => !_.isUndefined(ent));
    let acc = 0;
    while (acc !== skipLevels) {
      children = children
        .flatMap((ent) => ent.children.map((id) => notes[id]))
        .filter((ent) => !_.isUndefined(ent));
      acc += 1;
    }
    return children;
  };
}
