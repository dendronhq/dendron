import { DNoteAnchor } from "@dendronhq/common-all";
import {
  assertUnreachable,
  CONSTANTS,
  DendronError,
  DEngineClient,
  DLink,
  DNoteAnchorPositioned,
  DNoteLink,
  DNoteLoc,
  DNoteRefData,
  DNoteRefLink,
  DNoteRefLinkRaw,
  ERROR_STATUS,
  getSlugger,
  NoteChangeEntry,
  NoteProps,
  NoteUtils,
  Position,
} from "@dendronhq/common-all";
import { createLogger, note2String } from "@dendronhq/common-server";
import _ from "lodash";
import { Heading, Root } from "mdast";
import * as mdastBuilder from "mdast-builder";
import path from "path";
import { Processor } from "unified";
import { Node } from "unist";
import { selectAll } from "unist-util-select";
import visit from "unist-util-visit";
import { VFile } from "vfile";
import { normalizev2 } from "../../utils";
import {
  Anchor,
  BlockAnchor,
  DendronASTDest,
  DendronASTNode,
  DendronASTRoot,
  DendronASTTypes,
  NoteRefNoteV4,
  NoteRefNoteV4_LEGACY,
  WikiLinkNoteV4,
  WikiLinkProps,
} from "../types";
import { MDUtilsV4 } from "../utils";
import { MDUtilsV5, ProcMode } from "../utilsv5";
const toString = require("mdast-util-to-string");
export { mdastBuilder };
export { select, selectAll } from "unist-util-select";

export const ALIAS_DIVIDER = "|";

export function addError(proc: Processor, err: DendronError) {
  const errors = proc.data("errors") as DendronError[];
  errors.push(err);
  proc().data("errors", errors);
}

export function getNoteOrError(
  notes: NoteProps[],
  hint: any
): { error: DendronError | undefined; note: undefined | NoteProps } {
  let error: DendronError | undefined;
  let note: NoteProps | undefined;
  if (_.isUndefined(notes)) {
    error = new DendronError({ message: `no note found. ${hint}` });
    return { error, note };
  }
  if (notes.length > 1) {
    error = new DendronError({
      message: `multiple notes found for link: ${hint}`,
    });
    return { error, note };
  }
  if (notes.length < 1) {
    error = new DendronError({
      message: `no notes found for link: ${JSON.stringify(hint)}`,
    });
    return { error, note };
  }
  note = notes[0];
  return { error, note };
}

export type LinkFilter = {
  loc?: Partial<DNoteLoc>;
};

const getLinks = ({
  ast,
  note,
  filter,
}: {
  ast: DendronASTNode;
  note: NoteProps;
  filter: LinkFilter;
}) => {
  const wikiLinks: WikiLinkNoteV4[] = [];
  const noteRefs: (NoteRefNoteV4 | NoteRefNoteV4_LEGACY)[] = [];
  visit(
    ast,
    [
      DendronASTTypes.WIKI_LINK,
      DendronASTTypes.REF_LINK_V2,
      DendronASTTypes.REF_LINK,
    ],
    (node) => {
      switch (node.type) {
        case DendronASTTypes.WIKI_LINK:
          wikiLinks.push(node as WikiLinkNoteV4);
          break;
        case DendronASTTypes.REF_LINK_V2:
          noteRefs.push(node as NoteRefNoteV4);
          break;
        case DendronASTTypes.REF_LINK:
          noteRefs.push(node as NoteRefNoteV4_LEGACY);
          break;
      }
    }
  );

  const dlinks: DLink[] = [];
  for (const wikiLink of wikiLinks) {
    dlinks.push({
      type: LinkUtils.astType2DLinkType(wikiLink.type),
      from: NoteUtils.toNoteLoc(note),
      value: wikiLink.value,
      alias: wikiLink.data.alias,
      position: wikiLink.position!,
      xvault: !_.isUndefined(wikiLink.data.vaultName),
      // TODO: error if vault not found
      to: {
        fname: wikiLink.value,
        anchorHeader: wikiLink.data.anchorHeader,
        vaultName: wikiLink.data.vaultName,
      },
    });
  }
  // the cast is safe because the only difference is whether `data.vaultName` exists, which is already optional
  for (const noteRef of noteRefs as NoteRefNoteV4[]) {
    const { anchorStart, anchorEnd, anchorStartOffset } =
      noteRef.data.link.data;
    const anchorStartText = anchorStart ? anchorStart : "";
    const anchorStartOffsetText = anchorStartOffset
      ? `,${anchorStartOffset}`
      : "";
    const anchorEndText = anchorEnd ? `:#${anchorEnd}` : "";
    const anchorHeader = `${anchorStartText}${anchorStartOffsetText}${anchorEndText}`;

    dlinks.push({
      type: LinkUtils.astType2DLinkType(noteRef.type),
      from: NoteUtils.toNoteLoc(note),
      value: noteRef.data.link.from.fname,
      // not sure why typescript doesn't recognize the position, but I can confirm it exists in the debugger
      position: noteRef.position as Position,
      xvault: !_.isUndefined(noteRef.data.link.data.vaultName),
      // TODO: error if vault not found
      to: {
        fname: noteRef.data.link.from.fname, // not sure why, but noteRef's have their targets in `from` field
        anchorHeader: anchorHeader ? anchorHeader : undefined,
        vaultName: noteRef.data.link.data.vaultName,
      },
    });
  }

  if (filter?.loc) {
    // TODO: add additional filters besides fname
    return dlinks.filter((ent) => {
      return ent.value === filter?.loc?.fname;
    });
  }
  return dlinks;
};

export class LinkUtils {
  static astType2DLinkType(type: DendronASTTypes): DLink["type"] {
    switch (type) {
      case DendronASTTypes.WIKI_LINK:
        return "wiki";
      case DendronASTTypes.REF_LINK:
      case DendronASTTypes.REF_LINK_V2:
        return "ref";
      default:
        throw new DendronError({ message: `invalid type conversion: ${type}` });
    }
  }
  static dlink2DNoteLink(link: DLink): DNoteLink {
    return {
      data: {
        xvault: link.xvault,
      },
      from: {
        fname: link.value,
        alias: link.alias,
        anchorHeader: link.to?.anchorHeader,
        vaultName: link.from.vaultName,
      },
      type: link.type,
      position: link.position,
    };
  }
  /**
   * Get all links from the note body
   * Currently, just look for wiki links
   * @param opts.filter - {type, loc
   *
   * - type: filter by {@link DendronASTTypes}
   * - loc: filter by {@link DLoc}
   */
  static findLinks({
    note,
    engine,
    filter,
  }: {
    note: NoteProps;
    engine: DEngineClient;
    filter?: LinkFilter;
  }): DLink[] {
    const content = note.body;
    let remark = MDUtilsV5.procRemarkParse(
      { mode: ProcMode.FULL },
      {
        engine,
        fname: note.fname,
        vault: note.vault,
        dest: DendronASTDest.MD_DENDRON,
      }
    );
    let out = remark.parse(content) as DendronASTNode;
    const links: DLink[] = getLinks({
      ast: out,
      filter: { loc: filter?.loc },
      note,
    });
    return links;
  }
  static isAlias(link: string) {
    return link.indexOf("|") !== -1;
  }

  static hasFilter(link: string) {
    return link.indexOf(">") !== -1;
  }

  static parseAliasLink(link: string) {
    const [alias, value] = link.split("|").map(_.trim);
    return { alias, value: NoteUtils.normalizeFname(value) };
  }

  static parseDendronURI(linkString: string) {
    if (linkString.startsWith(CONSTANTS.DENDRON_DELIMETER)) {
      const [vaultName, link] = linkString
        .split(CONSTANTS.DENDRON_DELIMETER)[1]
        .split("/");
      return {
        vaultName,
        link,
      };
    }
    return {
      link: linkString,
    };
  }

  /** Either value or anchorHeader will always be present if the function did not
   *  return null. A missing value means that the file containing this link is
   *  the value.
   */
  static parseLinkV2(linkString: string):
    | {
        alias?: string;
        value: string;
        anchorHeader?: string;
        vaultName?: string;
      }
    | {
        alias?: string;
        value?: string;
        anchorHeader: string;
        vaultName?: string;
      }
    | null {
    const LINK_NAME = "[^#\\|>]+";
    // aliases may contain # symbols
    const ALIAS_NAME = "[^\\|>]+";
    const re = new RegExp(
      "" +
        // alias?
        `(` +
        `(?<alias>${ALIAS_NAME}(?=\\|))` +
        "\\|" +
        ")?" +
        // name
        `(?<value>${LINK_NAME})?` +
        // anchor?
        `(#(?<anchor>${LINK_NAME}))?` +
        // filters?
        `(>(?<filtersRaw>.*))?`,
      "i"
    );
    const out = linkString.match(re);
    if (out) {
      let { alias, value, anchor } = out.groups as any;
      if (!value && !anchor) return null; // Does not actually link to anything
      let vaultName: string | undefined;
      if (value) {
        ({ vaultName, link: value } = this.parseDendronURI(value));
        if (!alias) {
          alias = value;
        }
        alias = _.trim(alias);
        value = _.trim(value);
      }
      return { alias, value, anchorHeader: anchor, vaultName };
    } else {
      return null;
    }
  }

  static parseLink(linkMatch: string) {
    linkMatch = NoteUtils.normalizeFname(linkMatch);
    let out: WikiLinkProps = {
      value: linkMatch,
      alias: linkMatch,
    };
    if (LinkUtils.isAlias(linkMatch)) {
      out = LinkUtils.parseAliasLink(linkMatch);
    }
    if (out.value.indexOf("#") !== -1) {
      const [value, anchorHeader] = out.value.split("#").map(_.trim);
      out.value = value;
      out.anchorHeader = anchorHeader;
      // if we didn't have an alias, links with a # anchor shouldn't have # portion be in the title
      if (!LinkUtils.isAlias(linkMatch)) {
        out.alias = value;
      }
    }
    return out;
  }

  static parseNoteRefRaw(ref: string): DNoteRefLinkRaw {
    const optWikiFileName = /([^\]:#]*)/.source;
    const wikiFileName = /([^\]:#]+)/.source;
    const reLink = new RegExp(
      "" +
        `(?<name>${optWikiFileName})` +
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

    // pre-parse alias if it exists
    let alias: string | undefined;
    const [aliasPartFirst, aliasPartSecond] = ref.split("|");
    if (_.isUndefined(aliasPartSecond)) ref = aliasPartFirst;
    else {
      alias = aliasPartFirst;
      ref = aliasPartSecond;
    }

    // pre-parse vault name if it exists
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
        // remove .md extension if it exists, but keep full path in case this is an image
        fname = /^(?<name>.*?)(\.md)?$/.exec(_.trim(v as string))?.groups?.name;
      } else {
        // @ts-ignore
        clean[k] = v;
      }
    });
    if (clean.anchorStart && clean.anchorStart.indexOf(",") >= 0) {
      const [anchorStart, offset] = clean.anchorStart.split(",");
      clean.anchorStart = anchorStart;
      clean.anchorStartOffset = parseInt(offset);
    }
    if (_.isUndefined(fname) && _.isUndefined(clean.anchorStart)) {
      throw new DendronError({
        message: `both fname and anchorStart for ${ref} is undefined`,
      });
    }
    if (vaultName) {
      clean.vaultName = vaultName;
    }
    // TODO
    // @ts-ignore
    return { from: { fname, alias }, data: clean, type: "ref" };
  }

  static parseNoteRef(ref: string): DNoteRefLink {
    const noteRef = LinkUtils.parseNoteRefRaw(ref);
    if (
      _.isUndefined(noteRef.from?.fname) &&
      _.isUndefined(noteRef.data.anchorStart)
    ) {
      throw new DendronError({
        message: `both fname and anchorStart for ${ref} is undefined`,
      });
    }
    // @ts-ignore
    return noteRef;
  }

  static renderNoteLink({
    link,
    dest,
  }: {
    link: DNoteLink;
    dest: DendronASTDest;
  }): string | never {
    switch (dest) {
      case DendronASTDest.MD_DENDRON: {
        const ref = link.type === "ref" ? "!" : "";
        const vaultPrefix =
          link.from.vaultName && link.data.xvault
            ? `${CONSTANTS.DENDRON_DELIMETER}${link.from.vaultName}/`
            : "";
        const value = link.from.fname;
        const alias =
          !_.isUndefined(link.from.alias) && link.from.alias !== value
            ? link.from.alias + "|"
            : undefined;
        const anchor = link.from.anchorHeader
          ? `#${link.from.anchorHeader}`
          : "";
        // TODO: take into account piping direction
        return [ref, `[[`, alias, vaultPrefix, value, anchor, `]]`].join("");
      }
      default:
        return assertUnreachable();
    }
  }

  static updateLink({
    note,
    oldLink,
    newLink,
  }: {
    note: NoteProps;
    oldLink: DNoteLink;
    newLink: DNoteLink;
  }) {
    const { start, end } = oldLink.position!;
    const startOffset = start.offset!;
    const endOffset = end.offset!;
    const body = note.body;
    const newBody = [
      body.slice(0, startOffset),
      LinkUtils.renderNoteLink({
        link: newLink,
        dest: DendronASTDest.MD_DENDRON,
      }),
      body.slice(endOffset),
    ].join("");
    return newBody;
  }
}

export class AnchorUtils {
  static async findAnchors(
    opts: {
      note: NoteProps;
      wsRoot: string;
    },
    parseOpts: Parameters<typeof RemarkUtils.findAnchors>[1]
  ): Promise<{ [index: string]: DNoteAnchorPositioned }> {
    if (opts.note.stub) return {};
    try {
      const noteContents = await note2String(opts);
      const noteAnchors = RemarkUtils.findAnchors(noteContents, parseOpts);
      const anchors: [string, DNoteAnchorPositioned][] = [];
      noteAnchors.forEach((anchor) => {
        if (_.isUndefined(anchor.position)) return;
        const slugger = getSlugger();
        const { line, column } = anchor.position.start;
        if (anchor.type === DendronASTTypes.HEADING) {
          const value = slugger.slug(anchor.children[0].value as string);
          anchors.push([
            value,
            {
              type: "header",
              value,
              line: line - 1,
              column: column - 1,
            },
          ]);
        } else if (anchor.type === DendronASTTypes.BLOCK_ANCHOR) {
          anchors.push([
            `^${anchor.id}`,
            {
              type: "block",
              value: anchor.id,
              line: line - 1,
              column: column - 1,
            },
          ]);
        } else {
          assertUnreachable(anchor);
        }
      });
      return Object.fromEntries(anchors);
    } catch (err) {
      const error = DendronError.createFromStatus({
        status: ERROR_STATUS.UNKNOWN,
        payload: { note: NoteUtils.toLogObj(opts.note), wsRoot: opts.wsRoot },
        error: err,
      });
      createLogger("AnchorUtils").error(error);
      return {};
    }
  }

  static anchor2string(anchor: DNoteAnchor): string {
    if (anchor.type === "block") return `^${anchor.value}`;
    if (anchor.type === "header") return anchor.value;
    assertUnreachable(anchor.type);
  }
}

function walk(node: Node, fn: any) {
  fn(node);
  if (node.children) {
    (node.children as Node[]).forEach(function (n) {
      walk(n, fn);
    });
  }
}

const MAX_HEADING_DEPTH = 99999;

export class RemarkUtils {
  static bumpHeadings(root: Node, baseDepth: number) {
    var headings: Heading[] = [];
    walk(root, function (node: Node) {
      if (node.type === DendronASTTypes.HEADING) {
        headings.push(node as Heading);
      }
    });

    var minDepth = headings.reduce(function (memo, h) {
      return Math.min(memo, h.depth);
    }, MAX_HEADING_DEPTH);

    var diff = baseDepth + 1 - minDepth;

    headings.forEach(function (h) {
      h.depth += diff;
    });
  }

  static findAnchors(
    content: string,
    opts: Omit<Parameters<typeof MDUtilsV4.procParse>[0], "dest">
  ): Anchor[] {
    const parser = MDUtilsV4.procParse({
      dest: DendronASTDest.MD_DENDRON,
      ...opts,
    });
    const parsed = parser.parse(content);
    return [
      ...(selectAll(DendronASTTypes.HEADING, parsed) as Heading[]),
      ...(selectAll(DendronASTTypes.BLOCK_ANCHOR, parsed) as BlockAnchor[]),
    ];
  }

  static findIndex(array: Node[], fn: any) {
    for (var i = 0; i < array.length; i++) {
      if (fn(array[i], i)) {
        return i;
      }
    }
    return -1;
  }

  static isHeading(node: Node, text: string, depth?: number) {
    if (node.type !== DendronASTTypes.HEADING) {
      return false;
    }

    // wildcard is always true
    if (text === "*") {
      return true;
    }
    if (text) {
      var headingText = toString(node);
      return text.trim().toLowerCase() === headingText.trim().toLowerCase();
    }

    if (depth) {
      return (node as Heading).depth <= depth;
    }

    return true;
  }

  static isNoteRefV2(node: Node) {
    return node.type === DendronASTTypes.REF_LINK_V2;
  }

  // --- conversion

  static convertObsidianLinks(note: NoteProps, changes: NoteChangeEntry[]) {
    return function (this: Processor) {
      return (tree: Node, _vfile: VFile) => {
        let root = tree as DendronASTRoot;
        let wikiLinks: WikiLinkNoteV4[] = selectAll(
          DendronASTTypes.WIKI_LINK,
          root
        ) as WikiLinkNoteV4[];
        wikiLinks.forEach((linkNode) => {
          if (linkNode.value.indexOf("/") >= 0) {
            const newValue = _.replace(linkNode.value, /\//g, ".");
            if (linkNode.data.alias === linkNode.value) {
              linkNode.data.alias = newValue;
            }
            linkNode.value = newValue;
            changes.push({
              note: note,
              status: "update",
            });
          }
        });
      };
    };
  }

  static oldNoteRef2NewNoteRef(note: NoteProps, changes: NoteChangeEntry[]) {
    return function (this: Processor) {
      return (tree: Node, _vfile: VFile) => {
        let root = tree as DendronASTRoot;
        //@ts-ignore
        let notesRefLegacy: NoteRefNoteV4_LEGACY[] = selectAll(
          DendronASTTypes.REF_LINK,
          root
        );
        notesRefLegacy.map((noteRefLegacy) => {
          const slugger = getSlugger();
          // @ts-ignore;
          noteRefLegacy.type = DendronASTTypes.REF_LINK_V2;
          const { anchorStart, anchorEnd } = noteRefLegacy.data.link.data;
          if (anchorStart) {
            noteRefLegacy.data.link.data.anchorStart = normalizev2(
              anchorStart,
              slugger
            );
          }
          if (anchorEnd) {
            noteRefLegacy.data.link.data.anchorEnd = normalizev2(
              anchorEnd,
              slugger
            );
          }
        });
        if (!_.isEmpty(notesRefLegacy)) {
          changes.push({
            note,
            status: "update",
          });
        }
      };
    };
  }

  static h1ToTitle(note: NoteProps, changes: NoteChangeEntry[]) {
    return function (this: Processor) {
      return (tree: Node, _vfile: VFile) => {
        let root = tree as Root;
        const idx = _.findIndex(
          root.children,
          (ent) => ent.type === DendronASTTypes.HEADING && ent.depth === 1
        );
        if (idx >= 0) {
          const head = root.children.splice(idx, 1)[0] as Heading;
          if (head.children.length === 1 && head.children[0].type === "text") {
            note.title = head.children[0].value;
          }
          changes.push({
            note,
            status: "update",
          });
        }
      };
    };
  }

  static h1ToH2(note: NoteProps, changes: NoteChangeEntry[]) {
    return function (this: Processor) {
      return (tree: Node, _vfile: VFile) => {
        let root = tree as Root;
        const idx = _.findIndex(
          root.children,
          (ent) => ent.type === DendronASTTypes.HEADING && ent.depth === 1
        );
        if (idx >= 0) {
          const head = root.children[idx] as Heading;
          head.depth = 2;
          changes.push({
            note,
            status: "update",
          });
        }
      };
    };
  }
}
