import {
  CONSTANTS,
  DendronError,
  DEngineClientV2,
  DNoteRefData,
  DNoteRefLink,
  DVault,
  getSlugger,
  NotePropsDict,
  NoteProps,
  VaultUtils,
  NotesCache,
  NotesCacheEntry,
} from "@dendronhq/common-all";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { DendronEngineClient } from "./engineClient";
import { LinkUtils } from "./markdown/remark/utils";
import { WSMeta } from "./types";

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
}): string {
  const { link, useVaultPrefix } = opts;
  const slugger = getSlugger();
  const { anchorStart, anchorStartOffset, anchorEnd } = link.data;
  const { fname: name } = link.from;
  // [[foo]]#head1:#*"

  const linkParts = [`![[`];
  if (useVaultPrefix) {
    linkParts.push(VaultUtils.toURIPrefix(link.from.vault!) + "/");
  }
  linkParts.push(name);
  if (anchorStart) {
    linkParts.push(`#${normalizev2(anchorStart, slugger)}`);
  }
  if (anchorStartOffset) {
    linkParts.push(`,${anchorStartOffset}`);
  }
  if (anchorEnd) {
    linkParts.push(`:#${normalizev2(anchorEnd, slugger)}`);
  }
  linkParts.push("]]");
  return linkParts.join("");
}

export async function getEngine(opts: {
  numTries?: number;
  wsRoot: string;
  vaults: DVault[];
}): Promise<{ error?: DendronError; data?: DEngineClientV2 }> {
  const { numTries, wsRoot, vaults } = _.defaults(opts, { numTries: 5 });
  if (numTries <= 0) {
    return {
      error: new DendronError({ message: "exceeded numTries" }),
    };
  }
  return new Promise((resolve, _reject) => {
    try {
      const port = DendronEngineClient.getPort({ wsRoot });
      const dendronEngine = DendronEngineClient.create({
        port,
        ws: wsRoot,
        vaults,
      });
      resolve({
        data: dendronEngine,
      });
    } catch (err) {
      setTimeout(() => {
        resolve(getEngine({ ...opts, numTries: numTries - 1 }));
      }, 5000);
    }
  });
}

export function getPortFilePath({ wsRoot }: { wsRoot: string }) {
  const portFile = path.join(wsRoot, CONSTANTS.DENDRON_SERVER_PORT);
  return portFile;
}

export function getWSMetaFilePath({ wsRoot }: { wsRoot: string }) {
  const fsPath = path.join(wsRoot, CONSTANTS.DENDRON_WS_META);
  return fsPath;
}

export function openPortFile({ fpath }: { fpath: string }): number {
  return _.toInteger(_.trim(fs.readFileSync(fpath, { encoding: "utf8" })));
}

export function openWSMetaFile({ fpath }: { fpath: string }): WSMeta {
  return fs.readJSONSync(fpath) as WSMeta;
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
    clean.anchorStartOffset = parseInt(offset);
  }
  return { from: { fname }, data: clean, type: "ref" };
}

export function parseNoteRefV2(ref: string): DNoteRefLink {
  const wikiFileName = /([^\]:#]+)/.source;
  const reLink = new RegExp(
    "" +
      `(?<name>${wikiFileName})` +
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
  let vaultName: string | undefined = undefined;
  ({ vaultName, link: ref } = LinkUtils.parseDendronURI(ref));
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
    clean.anchorStartOffset = parseInt(offset);
  }
  if (vaultName) {
    clean.vaultName = vaultName;
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

export const readNotesFromCache = (vpath: string): NotesCache => {
  const cachePath = path.join(vpath, CONSTANTS.DENDRON_CACHE_FILE);
  if (fs.existsSync(cachePath)) {
    return fs.readJSONSync(cachePath) as NotesCache;
  }
  return {
    version: 0,
    notes: {},
  };
};

export const writeNotesToCache = (vpath: string, cache: NotesCache) => {
  const cachePath = path.join(vpath, CONSTANTS.DENDRON_CACHE_FILE);
  return fs.writeJSONSync(cachePath, cache);
};

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
    notes: NotePropsDict;
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
