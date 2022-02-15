import {
  ALIAS_NAME,
  assertUnreachable,
  ConfigUtils,
  CONSTANTS,
  DendronError,
  DEngineClient,
  DLink,
  DNodeProps,
  DNoteAnchor,
  DNoteAnchorBasic,
  DNoteAnchorPositioned,
  DNoteLink,
  DNoteLoc,
  DNoteRefData,
  DNoteRefLink,
  DNoteRefLinkRaw,
  DVault,
  ERROR_STATUS,
  getSlugger,
  IntermediateDendronConfig,
  isNotUndefined,
  LINK_CONTENTS,
  LINK_NAME,
  NoteBlock,
  NoteChangeEntry,
  NoteProps,
  NoteUtils,
  Point,
  Position,
  TAGS_HIERARCHY,
  TAGS_HIERARCHY_BASE,
  TagUtils,
  USERS_HIERARCHY_BASE,
  VaultUtils,
} from "@dendronhq/common-all";
import { createDisposableLogger } from "@dendronhq/common-server";
import _ from "lodash";
import type {
  FootnoteDefinition,
  FrontmatterContent,
  Heading,
  Image,
  Link,
  List,
  ListItem,
  Paragraph,
  Root,
  Table,
  TableCell,
  TableRow,
  Text,
} from "mdast";
import * as mdastBuilder from "mdast-builder";
import { Processor } from "unified";
import { Node, Parent } from "unist";
import { selectAll } from "unist-util-select";
import visit from "unist-util-visit";
import { VFile } from "vfile";
import { WorkspaceUtils } from "../../workspace";
import {
  Anchor,
  BlockAnchor,
  DendronASTDest,
  DendronASTNode,
  DendronASTRoot,
  DendronASTTypes,
  ExtendedImage,
  HashTag,
  NoteRefNoteV4,
  UserTag,
  WikiLinkNoteV4,
  WikiLinkProps,
} from "../types";
import { MDUtilsV5, ProcFlavor, ProcMode } from "../utilsv5";

const toString = require("mdast-util-to-string");

export { select, selectAll } from "unist-util-select";
export { mdastBuilder };
export { visit };
export { LINK_CONTENTS, LINK_NAME, ALIAS_NAME };

export function addError(proc: Processor, err: DendronError) {
  const errors = proc.data("errors") as DendronError[];
  errors.push(err);
  // no need to put errors back into proc, it's a mutable array
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

export type ParseLinkV2Resp =
  | {
      alias?: string;
      value: string;
      anchorHeader?: string;
      vaultName?: string;
      sameFile: false;
    }
  | {
      alias?: string;
      value?: string;
      anchorHeader: string;
      vaultName?: string;
      sameFile: true;
    };

export function hashTag2WikiLinkNoteV4(hashtag: HashTag): WikiLinkNoteV4 {
  return {
    ...hashtag,
    type: DendronASTTypes.WIKI_LINK,
    value: hashtag.fname,
    data: {
      alias: hashtag.value,
    },
  };
}

export function userTag2WikiLinkNoteV4(userTag: UserTag): WikiLinkNoteV4 {
  return {
    ...userTag,
    type: DendronASTTypes.WIKI_LINK,
    value: userTag.fname,
    data: {
      alias: userTag.value,
    },
  };
}

export function frontmatterTag2WikiLinkNoteV4(
  tag: string,
  useHashSymbol?: boolean
): WikiLinkNoteV4 {
  return {
    type: DendronASTTypes.WIKI_LINK,
    value: `${TAGS_HIERARCHY}${tag}`,
    data: {
      alias: useHashSymbol ? `#${tag}` : tag,
    },
  };
}

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
  const noteRefs: NoteRefNoteV4[] = [];
  visit(ast, (node) => {
    switch (node.type) {
      case DendronASTTypes.WIKI_LINK:
        wikiLinks.push(node as WikiLinkNoteV4);
        break;
      case DendronASTTypes.REF_LINK_V2:
        noteRefs.push(node as NoteRefNoteV4);
        break;
      case DendronASTTypes.HASHTAG: {
        wikiLinks.push(hashTag2WikiLinkNoteV4(node as HashTag));
        break;
      }
      case DendronASTTypes.USERTAG: {
        wikiLinks.push(userTag2WikiLinkNoteV4(node as UserTag));
        break;
      }
      default:
      /* nothing */
    }
  });
  const dlinks: DLink[] = [];

  if (isNotUndefined(note.tags)) {
    let tags: string[];
    if (_.isString(note.tags)) {
      tags = [note.tags];
    } else {
      tags = note.tags;
    }

    for (const tag of tags) {
      dlinks.push({
        type: "frontmatterTag",
        from: NoteUtils.toNoteLoc(note),
        value: `${TAGS_HIERARCHY}${tag}`,
        alias: tag,
        xvault: false,
        position: undefined,
        to: {
          fname: `${TAGS_HIERARCHY}${tag}`,
        },
      });
    }
  }

  for (const wikiLink of wikiLinks) {
    dlinks.push({
      type: LinkUtils.astType2DLinkType(wikiLink.type),
      from: NoteUtils.toNoteLoc(note),
      value: wikiLink.value,
      alias: wikiLink.data.alias,
      position: wikiLink.position as Position,
      xvault: !_.isUndefined(wikiLink.data.vaultName),
      sameFile: wikiLink.data.sameFile,
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
    const anchorStartText = anchorStart || "";
    const anchorStartOffsetText = anchorStartOffset
      ? `,${anchorStartOffset}`
      : "";
    const anchorEndText = anchorEnd ? `:#${anchorEnd}` : "";
    const anchorHeader = `${anchorStartText}${anchorStartOffsetText}${anchorEndText}`;

    dlinks.push({
      type: LinkUtils.astType2DLinkType(noteRef.type),
      from: NoteUtils.toNoteLoc(note),
      value: noteRef.data.link.from.fname,
      // not sure why typescript doesn't recognize the position, but I can confirm it exists
      position: noteRef.position as Position,
      xvault: !_.isUndefined(noteRef.data.link.data.vaultName),
      // TODO: error if vault not found
      to: {
        fname: noteRef.data.link.from.fname, // not sure why, but noteRef's have their targets in `from` field
        anchorHeader: anchorHeader || undefined,
        vaultName: noteRef.data.link.data.vaultName,
      },
    });
  }

  if (filter?.loc) {
    // TODO: add additional filters besides fname
    return dlinks.filter((ent) => {
      return ent.value.toLowerCase() === filter?.loc?.fname?.toLowerCase();
    });
  }
  const { logger, dispose } = createDisposableLogger("LinkUtils.getLinks");
  logger.info({
    ctx: "getLinks",
    dlinksLength: dlinks.length,
    noteRefsLength: noteRefs.length,
    wikiLinksLength: wikiLinks.length,
    filterLocFname: filter?.loc?.fname,
  });
  dispose();
  return dlinks;
};

const getLinkCandidates = ({
  ast,
  note,
  notesMap,
}: {
  ast: DendronASTNode;
  note: NoteProps;
  notesMap: Map<string, NoteProps>;
}) => {
  const textNodes: Text[] = [];
  visit(
    ast,
    [DendronASTTypes.TEXT],
    (node: Text, _index: number, parent: Parent | undefined) => {
      if (parent?.type === "paragraph" || parent?.type === "tableCell") {
        textNodes.push(node);
      }
    }
  );

  const linkCandidates: DLink[] = [];
  _.map(textNodes, (textNode: Text) => {
    const value = textNode.value as string;
    // handling text nodes that start with \n
    if (textNode.position!.start.line !== textNode.position!.end.line) {
      textNode.position!.start = {
        line: textNode.position!.start.line + 1,
        column: 1,
      };
    }
    value.split(/\s+/).filter((word) => {
      const maybeNote = notesMap.get(word);
      if (maybeNote !== undefined) {
        const candidate = {
          type: "linkCandidate",
          from: NoteUtils.toNoteLoc(note),
          value: value.trim(),
          position: textNode.position as Position,
          to: {
            fname: word,
            vaultName: VaultUtils.getName(maybeNote.vault),
          },
        } as DLink;
        linkCandidates.push(candidate);
      }
      return maybeNote !== undefined;
    });
  });
  return linkCandidates;
};

export class LinkUtils {
  static astType2DLinkType(type: DendronASTTypes): DLink["type"] {
    switch (type) {
      case DendronASTTypes.WIKI_LINK:
        return "wiki";
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
        sameFile: link.sameFile,
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
    const remark = MDUtilsV5.procRemarkParseFull(
      { flavor: ProcFlavor.REGULAR },
      {
        engine,
        fname: note.fname,
        vault: note.vault,
        dest: DendronASTDest.MD_DENDRON,
      }
    );
    const out = remark.parse(content) as DendronASTNode;
    const links: DLink[] = getLinks({
      ast: out,
      filter: { loc: filter?.loc },
      note,
    });
    return links;
  }

  static findHashTags({ links }: { links: DLink[] }) {
    return links.filter((l) => {
      if (l.to as DNoteLoc) {
        return l.value.startsWith("tags.");
      }
      return false;
    });
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
   *
   *  if `explicitAlias` is false, non-existent alias will be
   *  implicitly assumed to be the value of the link.
   */
  static parseLinkV2(opts: {
    linkString: string;
    explicitAlias?: boolean;
  }): ParseLinkV2Resp | null {
    const { linkString, explicitAlias } = _.defaults(opts, {
      explicitAlias: false,
    });
    const re = new RegExp(LINK_CONTENTS, "i");
    const out = linkString.match(re);
    if (out && out.groups) {
      let { alias, value } = out.groups;
      const { anchor } = out.groups;
      if (!value && !anchor) return null; // Does not actually link to anything
      let vaultName: string | undefined;
      if (value) {
        ({ vaultName, link: value } = this.parseDendronURI(value));
        if (!alias && !explicitAlias) {
          alias = value;
        }
        alias = _.trim(alias);
        value = _.trim(value);
      }
      return {
        alias,
        value,
        anchorHeader: anchor,
        vaultName,
        sameFile: _.isUndefined(value),
      };
    } else {
      return null;
    }
  }

  static getNotesFromWikiLinks(opts: {
    activeNote: DNodeProps;
    wikiLinks: ParseLinkV2Resp[];
    engine: DEngineClient;
  }) {
    const { activeNote, wikiLinks, engine } = opts;
    const { vaults, notes, wsRoot } = engine;

    let out: DNodeProps[] = [];
    wikiLinks.forEach((wikiLink) => {
      const fname = wikiLink.sameFile ? activeNote.fname : wikiLink.value;

      const vault = wikiLink.vaultName
        ? (VaultUtils.getVaultByName({
            vname: wikiLink.vaultName,
            vaults,
          }) as DVault)
        : undefined;

      if (vault) {
        const note = NoteUtils.getNoteByFnameV5({
          fname,
          notes,
          vault,
          wsRoot,
        });
        if (note) {
          out.push(note);
        }
      } else {
        const notesWithSameFname = NoteUtils.getNotesByFname({
          fname,
          notes,
        });
        out = out.concat(notesWithSameFname);
      }
    });
    return out;
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
    let vaultName: string | undefined;
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
      clean.anchorStartOffset = parseInt(offset, 10);
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
  }): string {
    switch (dest) {
      case DendronASTDest.MD_DENDRON: {
        if (this.isHashtagLink(link.from)) {
          return link.from.alias;
        }
        if (this.isUserTagLink(link.from)) {
          return link.from.alias;
        }
        const ref = link.type === "ref" ? "!" : "";
        const vaultPrefix =
          link.from.vaultName && link.data.xvault
            ? `${CONSTANTS.DENDRON_DELIMETER}${link.from.vaultName}/`
            : "";
        let value = link.from.fname;
        const alias =
          !_.isUndefined(link.from.alias) && link.from.alias !== value
            ? link.from.alias + "|"
            : undefined;
        const anchor = link.from.anchorHeader
          ? `#${link.from.anchorHeader}`
          : "";
        if (link.data.sameFile && anchor !== "") {
          // This is a same file reference, for example `[[#anchor]]`
          value = "";
        }
        // TODO: take into account piping direction
        return [ref, `[[`, alias, vaultPrefix, value, anchor, `]]`].join("");
      }
      default:
        throw new DendronError({
          message: "Tried to render a link to an unexpected format",
          payload: {
            ctx: "renderNoteLink",
            dest,
            link,
          },
        });
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
    if (oldLink.type === "frontmatterTag") {
      // Just change the prop
      const oldTag = oldLink.from.alias!;
      const newTag = newLink.from.alias;
      TagUtils.replaceTag({ note, oldTag, newTag });
      return note.body;
    } else {
      // Need to update note body
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

  static isHashtagLink(link: DNoteLoc): link is DNoteLoc & { alias: string } {
    return (
      link.alias !== undefined &&
      link.alias.startsWith("#") &&
      link.fname.startsWith(TAGS_HIERARCHY_BASE)
    );
  }

  static isUserTagLink(link: DNoteLoc): link is DNoteLoc & { alias: string } {
    return (
      link.alias !== undefined &&
      link.alias.startsWith("@") &&
      link.fname.startsWith(USERS_HIERARCHY_BASE)
    );
  }

  static findLinkCandidates({
    note,
    // notes,
    notesMap,
    engine,
  }: {
    note: NoteProps;
    // notes: NoteProps[];
    notesMap: Map<string, NoteProps>;
    engine: DEngineClient;
  }) {
    const content = note.body;
    const remark = MDUtilsV5.procRemarkParse(
      { mode: ProcMode.FULL },
      {
        engine,
        fname: note.fname,
        vault: note.vault,
        dest: DendronASTDest.MD_DENDRON,
      }
    );
    const tree = remark.parse(content) as DendronASTNode;
    const linkCandidates: DLink[] = getLinkCandidates({
      ast: tree,
      note,
      notesMap,
    });
    return linkCandidates;
  }

  static hasVaultPrefix(link: DLink) {
    if (link.to?.vaultName) {
      return true;
    } else return false;
  }

  /**
   * Given a source string, extract all wikilinks within the source.
   *
   * @param source string to extract wikilinks from
   */
  static extractWikiLinks(source: string) {
    // chop up the source.
    const regExp = new RegExp("\\[\\[(.+?)?\\]\\]", "g");
    const matched = [...source.matchAll(regExp)].map((match) => {
      return LinkUtils.parseLinkV2({ linkString: match[1] });
    });

    return matched.filter((match) => !_.isNull(match)) as ParseLinkV2Resp[];
  }
}

export class AnchorUtils {
  /** Given a header, finds the text of that header, including any wikilinks or hashtags that are included in the header.
   *
   * For example, for the header `## Foo [[Bar|bar]] and #baz`, the text should be `Foo Bar and #baz`.
   */
  static headerText(header: Heading): string {
    const headerText: string[] = [];
    visit(header, (node) => {
      switch (node.type) {
        case DendronASTTypes.TEXT:
          headerText.push((node as Text).value);
          break;
        case DendronASTTypes.WIKI_LINK:
          headerText.push((node as WikiLinkNoteV4).data.alias);
          break;
        case DendronASTTypes.HASHTAG:
          headerText.push((node as HashTag).value);
          break;
        default:
        /* nothing */
      }
    });
    return _.trim(headerText.join(""));
  }

  /** Given a header, finds the range of text that marks the contents of the header.
   *
   * For example, for the header `## Foo [[Bar|bar]] and #baz`, the range will start after `## ` and end at the end of the line.
   */
  static headerTextPosition(header: Heading): Position {
    let start: Point | undefined;
    let end: Point | undefined;
    visit(
      header,
      [
        DendronASTTypes.TEXT,
        DendronASTTypes.WIKI_LINK,
        DendronASTTypes.HASHTAG,
        DendronASTTypes.BLOCK_ANCHOR,
      ],
      (node) => {
        if (node.type === DendronASTTypes.BLOCK_ANCHOR && end) {
          // Preserve whitespace after the header, for example `# foo ^bar`, where
          // `^bar` must be separated with a space since it's not part of the header
          end.column -= 1;
          return;
        }
        if (_.isUndefined(start)) start = node.position!.start;
        end = node.position!.end;
      }
    );
    if (_.isUndefined(start) || _.isUndefined(end))
      throw new DendronError({
        message: "Unable to find the region of text containing the header",
      });

    return { start, end };
  }

  /** Given a *parsed* anchor node, returns the anchor id ("header" or "^block" and positioned anchor object for it. */
  static anchorNode2anchor(
    node: Anchor,
    slugger: ReturnType<typeof getSlugger>
  ): [string, DNoteAnchorPositioned] | undefined {
    if (_.isUndefined(node.position)) return undefined;

    const { line, column } = node.position.start;
    if (node.type === DendronASTTypes.HEADING) {
      const headerNode = node as Heading;
      const text = this.headerText(headerNode);
      const value = slugger.slug(this.headerText(headerNode));
      return [
        value,
        {
          type: "header",
          text,
          value,
          line: line - 1,
          column: column - 1,
          depth: headerNode.depth,
        },
      ];
    } else if (node.type === DendronASTTypes.BLOCK_ANCHOR) {
      return [
        `^${node.id}`,
        {
          type: "block",
          value: node.id,
          line: line - 1,
          column: column - 1,
        },
      ];
    } else {
      assertUnreachable(node);
    }
  }

  static async findAnchors(opts: {
    note: NoteProps;
    wsRoot: string;
  }): Promise<{ [index: string]: DNoteAnchorPositioned }> {
    if (opts.note.stub) return {};
    try {
      const noteContents = NoteUtils.serialize(opts.note);
      const noteAnchors = RemarkUtils.findAnchors(noteContents);
      const slugger = getSlugger();

      const anchors: [string, DNoteAnchorPositioned][] = noteAnchors
        .map((anchor) => this.anchorNode2anchor(anchor, slugger))
        .filter(isNotUndefined);

      return Object.fromEntries(anchors);
    } catch (err) {
      const error = DendronError.createFromStatus({
        status: ERROR_STATUS.UNKNOWN,
        payload: { note: NoteUtils.toLogObj(opts.note), wsRoot: opts.wsRoot },
        innerError: err as Error,
      });
      const { logger, dispose } = createDisposableLogger("AnchorUtils");
      logger.error(error);
      dispose();
      return {};
    }
  }

  static anchor2string(anchor: DNoteAnchor | DNoteAnchorBasic): string {
    if (anchor.type === "block") return `^${anchor.value}`;
    if (anchor.type === "header") return anchor.value;
    if (anchor.type === "line") return `L${anchor.line}`;
    assertUnreachable(anchor);
  }
}

function walk(node: Parent, fn: any) {
  fn(node);
  if (node.children) {
    (node.children as Node[]).forEach((n) => {
      // @ts-ignore
      walk(n, fn);
    });
  }
}

const MAX_HEADING_DEPTH = 99999;

const NODE_TYPES_TO_EXTRACT = [
  DendronASTTypes.BLOCK_ANCHOR,
  DendronASTTypes.HEADING,
  DendronASTTypes.LIST,
  DendronASTTypes.LIST_ITEM,
  DendronASTTypes.TABLE,
  DendronASTTypes.PARAGRAPH,
];

export class RemarkUtils {
  /**
   * Use this to [[Get the line offset of the frontmatter|dendron://dendron.docs/pkg.plugin-core.dev.cook#get-the-line-offset-of-the-frontmatter]]
   * Given a string representation of a Dendron note,
   * return the position of the line right after the frontmatter.
   * @param fileText file content string to traverse
   * @returns position in parsed file content right after the frontmatter
   */
  static getNodePositionPastFrontmatter(fileText: string) {
    const proc = MDUtilsV5.procRemarkParseNoData(
      {},
      { dest: DendronASTDest.MD_DENDRON }
    );
    const parsed = proc.parse(fileText);
    let out: Position | undefined;
    visit(parsed, ["yaml"], (node) => {
      if (_.isUndefined(node.position)) return false; // should never happen
      out = node.position;
      return false;
    });
    return out;
  }

  static bumpHeadings(root: Parent, baseDepth: number) {
    const headings: Heading[] = [];
    walk(root, (node: Node) => {
      if (node.type === DendronASTTypes.HEADING) {
        headings.push(node as Heading);
      }
    });

    const minDepth = headings.reduce((memo, h) => {
      return Math.min(memo, h.depth);
    }, MAX_HEADING_DEPTH);

    const diff = baseDepth + 1 - minDepth;

    headings.forEach((h) => {
      h.depth += diff;
    });
  }

  static findAnchors(content: string): Anchor[] {
    const parser = MDUtilsV5.procRehypeParse({
      mode: ProcMode.NO_DATA,
    });
    const parsed = parser.parse(content);
    return [
      ...(selectAll(DendronASTTypes.HEADING, parsed) as Heading[]),
      ...(selectAll(DendronASTTypes.BLOCK_ANCHOR, parsed) as BlockAnchor[]),
    ];
  }

  static isHeading(node: Node, text: string, depth?: number): node is Heading {
    if (node.type !== DendronASTTypes.HEADING) {
      return false;
    }

    // wildcard is always true
    if (text === "*") {
      return true;
    }
    if (text) {
      const headingText = toString(node);
      return text.trim().toLowerCase() === headingText.trim().toLowerCase();
    }

    if (depth) {
      return (node as Heading).depth <= depth;
    }

    return true;
  }

  static isRoot(node: Node): node is Parent {
    return node.type === DendronASTTypes.ROOT;
  }

  static isParent(node: Node): node is Parent {
    // @ts-ignore
    return _.isArray(node.children);
  }

  static isParagraph(node: Node): node is Paragraph {
    return node.type === DendronASTTypes.PARAGRAPH;
  }

  static isTable(node: Node): node is Table {
    return node.type === DendronASTTypes.TABLE;
  }

  static isTableRow(node: Node): node is TableRow {
    return node.type === DendronASTTypes.TABLE_ROW;
  }

  static isTableCell(node: Node): node is TableCell {
    return node.type === DendronASTTypes.TABLE_CELL;
  }

  static isList(node: Node): node is List {
    return node.type === DendronASTTypes.LIST;
  }

  static isNoteRefV2(node: Node): node is NoteRefNoteV4 {
    return node.type === DendronASTTypes.REF_LINK_V2;
  }

  static isImage(node: Node): node is Image {
    return node.type === DendronASTTypes.IMAGE;
  }

  static isExtendedImage(node: Node): node is ExtendedImage {
    return node.type === DendronASTTypes.EXTENDED_IMAGE;
  }

  static isText(node: Node): node is Text {
    return node.type === DendronASTTypes.TEXT;
  }

  static isLink(node: Node): node is Link {
    return node.type === DendronASTTypes.LINK;
  }

  static isFootnoteDefinition(node: Node): node is FootnoteDefinition {
    return node.type === DendronASTTypes.FOOTNOTE_DEFINITION;
  }

  static isFrontmatter(node: Node): node is FrontmatterContent {
    return node.type === DendronASTTypes.FRONTMATTER;
  }

  static isNodeWithPosition<N extends Node>(
    node: N
  ): node is N & { position: Position } {
    return node.position !== undefined;
  }

  // --- conversion

  static convertLinksFromDotNotation(
    note: NoteProps,
    changes: NoteChangeEntry[]
  ) {
    const prevNote = { ...note };
    return function (this: Processor) {
      return (tree: Node, _vfile: VFile) => {
        const root = tree as DendronASTRoot;
        const wikiLinks: WikiLinkNoteV4[] = selectAll(
          DendronASTTypes.WIKI_LINK,
          root
        ) as WikiLinkNoteV4[];

        let dirty = false;

        wikiLinks.forEach((linkNode) => {
          let newValue = linkNode.value;

          // Add a leading slash to the path as some markdown parsers require it for links
          if (!newValue.startsWith("/")) {
            newValue = "/" + newValue;
            dirty = true;
          }

          if (linkNode.value.indexOf(".") >= 0) {
            newValue = _.replace(newValue, /\./g, "/");

            if (linkNode.data.alias === linkNode.value) {
              linkNode.data.alias = newValue;
            }
            dirty = true;
          }

          linkNode.value = newValue;
        });
        //TODO: Add support for Ref Notes and Block Links

        if (dirty) {
          changes.push({
            note,
            prevNote,
            status: "update",
          });
        }
      };
    };
  }

  static convertWikiLinkToNoteUrl(
    note: NoteProps,
    changes: NoteChangeEntry[],
    engine: DEngineClient,
    dendronConfig: IntermediateDendronConfig
  ) {
    const prevNote = { ...note };
    return function (this: Processor) {
      return (tree: Node, _vfile: VFile) => {
        const root = tree as DendronASTRoot;
        const wikiLinks: WikiLinkNoteV4[] = selectAll(
          DendronASTTypes.WIKI_LINK,
          root
        ) as WikiLinkNoteV4[];

        /** used findLinks to get vault of wikilink */
        const links = LinkUtils.findLinks({ note, engine }).filter(
          (linkNode) => linkNode.type === "wiki"
        );
        let dirty = false;

        links.forEach((linkNode, i) => {
          let vault: DVault | undefined;

          // If the link specifies a vault, we should only look at that vault
          if (linkNode.to && !_.isUndefined(linkNode.to?.vaultName)) {
            vault = VaultUtils.getVaultByName({
              vaults: engine.vaults,
              vname: linkNode.to?.vaultName,
            });
          }
          const existingNote = NoteUtils.getNoteFromMultiVault({
            fname: linkNode.value,
            engine,
            fromVault: note.vault,
            toVault: vault,
            wsRoot: engine.wsRoot,
          });
          if (existingNote) {
            const publishingConfig =
              ConfigUtils.getPublishingConfig(dendronConfig);
            const urlRoot = publishingConfig.siteUrl || "";
            const { vault } = existingNote;
            wikiLinks[i]["value"] = WorkspaceUtils.getNoteUrl({
              config: dendronConfig,
              note: existingNote,
              vault,
              urlRoot,
              anchor: linkNode.to?.anchorHeader,
            });
            dirty = true;
          }
        });

        if (dirty) {
          changes.push({
            note,
            prevNote,
            status: "update",
          });
        }
      };
    };
  }

  static h1ToTitle(note: NoteProps, changes: NoteChangeEntry[]) {
    const prevNote = { ...note };
    return function (this: Processor) {
      return (tree: Node, _vfile: VFile) => {
        const root = tree as Root;
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
            prevNote,
            status: "update",
          });
        }
      };
    };
  }

  static h1ToH2(note: NoteProps, changes: NoteChangeEntry[]) {
    const prevNote = { ...note };
    return function (this: Processor) {
      return (tree: Node, _vfile: VFile) => {
        const root = tree as Root;
        const idx = _.findIndex(
          root.children,
          (ent) => ent.type === DendronASTTypes.HEADING && ent.depth === 1
        );
        if (idx >= 0) {
          const head = root.children[idx] as Heading;
          head.depth = 2;
          changes.push({
            note,
            prevNote,
            status: "update",
          });
        }
      };
    };
  }

  /**
   * Recursively check if two given node has identical children.
   * At each level _position_ is omitted as this can change if
   * you are comparing from two different trees.
   * @param a first {@link Node} to compare
   * @param b second {@link Node} to compare
   * @returns boolean
   */
  static hasIdenticalChildren = (a: Node, b: Node): boolean => {
    if (_.isEqual(Object.keys(a).sort(), Object.keys(b).sort())) {
      const aOmit = _.omit(a, ["position", "children"]);
      const bOmit = _.omit(b, ["position", "children"]);
      if (_.isEqual(aOmit, bOmit)) {
        if (_.has(a, "children")) {
          return _.every(
            // @ts-ignore
            a.children as Node[],
            (aChild: Node, aIndex: number) => {
              // @ts-ignore
              const bChild = (b.children as Node[])[aIndex];
              return RemarkUtils.hasIdenticalChildren(aChild, bChild);
            }
          );
        }
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  };

  /**
   * Given a markdown AST and a target heading node,
   * Find all the node that belongs under the heading.
   * This will extract all nodes until it hits the next heading
   * with the same depth of the target heading.
   * @param tree Abstract syntax tree
   * @param targetHeader Heading to target
   * @returns nodes to extract
   */
  static extractHeaderBlock(tree: Node, targetHeader: Heading) {
    let headerFound = false;
    let foundHeaderIndex: number | undefined;
    let nextHeaderIndex: number | undefined;
    visit(tree, (node, index) => {
      if (nextHeaderIndex) {
        return;
      }
      // @ts-ignore
      const depth = node.depth as Heading["depth"];
      if (!headerFound) {
        if (node.type === DendronASTTypes.HEADING) {
          if (
            depth === targetHeader!.depth &&
            RemarkUtils.hasIdenticalChildren(node, targetHeader!)
          ) {
            headerFound = true;
            foundHeaderIndex = index;
            return;
          }
        }
      } else if (node.type === DendronASTTypes.HEADING) {
        if (foundHeaderIndex) {
          if (depth <= targetHeader!.depth) nextHeaderIndex = index;
        }
      }
    });

    if (!headerFound || !RemarkUtils.isParent(tree)) {
      return [];
    }
    const nodesToExtract = nextHeaderIndex
      ? tree.children.splice(
          foundHeaderIndex!,
          nextHeaderIndex! - foundHeaderIndex!
        )
      : tree.children.splice(foundHeaderIndex!);
    return nodesToExtract;
  }

  /** Extract all blocks from the note which could be referenced by a block anchor.
   *
   * If those blocks already have anchors (or if they are a header), this will also find that anchor.
   *
   * @param note The note from which blocks will be extracted.
   */
  static async extractBlocks({
    note,
    engine,
  }: {
    note: NoteProps;
    engine: DEngineClient;
  }): Promise<NoteBlock[]> {
    const proc = MDUtilsV5.procRemarkFull({
      engine,
      vault: note.vault,
      fname: note.fname,
      dest: DendronASTDest.MD_DENDRON,
    });
    const slugger = getSlugger();

    // Read and parse the note
    const noteText = NoteUtils.serialize(note);
    const noteAST = proc.parse(noteText);
    // @ts-ignore
    if (_.isUndefined(noteAST.children)) return [];
    // @ts-ignore
    const nodesToSearch = _.filter(noteAST.children as Node[], (node) =>
      _.includes(NODE_TYPES_TO_EXTRACT, node.type)
    );

    // Extract the blocks
    const blocks: NoteBlock[] = [];
    for (const node of nodesToSearch) {
      // Block anchors at top level refer to the blocks before them
      if (node.type === DendronASTTypes.PARAGRAPH) {
        // These look like a paragraph...
        const parent = node as Paragraph;
        if (parent.children.length === 1) {
          // ... that has only a block anchor in it ...
          const child = parent.children[0] as Node;
          if (child.type === DendronASTTypes.BLOCK_ANCHOR) {
            // ... in which case this block anchor refers to the previous block, if any
            const previous = _.last(blocks);
            if (!_.isUndefined(previous))
              [, previous.anchor] =
                AnchorUtils.anchorNode2anchor(child as BlockAnchor, slugger) ||
                [];
            // Block anchors themselves are not blocks, don't extract them
            continue;
          }
        }
      }

      // Extract list items out of lists. We also extract them from nested lists,
      // because block anchors can't refer to nested lists, only items inside of them
      if (node.type === DendronASTTypes.LIST) {
        visit(node, [DendronASTTypes.LIST_ITEM], (listItem: ListItem) => {
          // The list item might have a block anchor inside of it.
          let anchor: DNoteAnchorPositioned | undefined;
          visit(
            listItem,
            [DendronASTTypes.BLOCK_ANCHOR, DendronASTTypes.LIST],
            (inListItem) => {
              // Except if we hit a nested list, because then the block anchor refers to the item in the nested list
              if (inListItem.type === DendronASTTypes.LIST) return "skip";
              [, anchor] =
                AnchorUtils.anchorNode2anchor(
                  inListItem as BlockAnchor,
                  slugger
                ) || [];
              return;
            }
          );

          blocks.push({
            text: proc.stringify(listItem),
            anchor,
            // position can only be undefined for generated nodes, not for parsed ones
            position: listItem.position!,
            type: listItem.type,
          });
        });
      }

      // extract the anchor for this block, if it exists
      let anchor: DNoteAnchorPositioned | undefined;
      if (node.type === DendronASTTypes.HEADING) {
        // Headings are anchors themselves
        [, anchor] =
          AnchorUtils.anchorNode2anchor(node as Heading, slugger) || [];
      } else if (node.type !== DendronASTTypes.LIST) {
        // Other nodes might have block anchors inside them
        // Except lists, because anchors inside lists only refer to specific list items
        visit(node, [DendronASTTypes.BLOCK_ANCHOR], (child) => {
          [, anchor] =
            AnchorUtils.anchorNode2anchor(child as BlockAnchor, slugger) || [];
        });
      }

      // extract the block
      blocks.push({
        text: proc.stringify(node),
        anchor,
        // position can only be undefined for generated nodes, not for parsed ones
        position: node.position!,
        type: node.type,
      });
    }

    return blocks;
  }

  static extractFootnoteDefs(root: Node): FootnoteDefinition[] {
    return selectAll(DendronASTTypes.FOOTNOTE_DEFINITION, root).filter(
      RemarkUtils.isFootnoteDefinition
    );
  }
}
