import {
  CONSTANTS,
  DendronError,
  DEngineClient,
  DLink,
  getSlugger,
  NoteChangeEntry,
  NoteProps,
  NoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import { Heading, Root } from "mdast";
import { Processor } from "unified";
import { Node } from "unist";
import { selectAll } from "unist-util-select";
import { VFile } from "vfile";
import { normalizev2 } from "../../utils";
import {
  BlockAnchor,
  DendronASTDest,
  DendronASTRoot,
  DendronASTTypes,
  NoteRefNoteV4_LEGACY,
  WikiLinkNoteV4,
  WikiLinkProps,
} from "../types";
import { MDUtilsV4 } from "../utils";
const toString = require("mdast-util-to-string");
import * as mdastBuilder from "mdast-builder";
import { blockAnchors } from "./blockAnchors";
export { mdastBuilder };

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

export class LinkUtils {
  /**
   * Get all links from the note body
   * Currently, just look for wiki links
   * @param param0
   */
  static findLinks({
    note,
    engine,
  }: {
    note: NoteProps;
    engine: DEngineClient;
  }): DLink[] {
    const content = note.body;
    let remark = MDUtilsV4.procParse({
      dest: DendronASTDest.MD_DENDRON,
      engine,
      fname: note.fname,
    });
    let out = remark.parse(content);
    let out2: WikiLinkNoteV4[] = selectAll("wikiLink", out) as WikiLinkNoteV4[];
    const dlinks = out2.map(
      (m: WikiLinkNoteV4) =>
        ({
          type: "wiki",
          from: NoteUtils.toNoteLoc(note),
          original: m.value,
          value: m.value,
          alias: m.data.alias,
          pos: {
            start: m.position?.start.offset,
            end: m.position?.end.offset,
          },
          // TODO: error if vault not found
          to: {
            fname: m.value,
            anchorHeader: m.data.anchorHeader,
            vault: m.data.vaultName
              ? VaultUtils.getVaultByName({
                  vaults: engine.vaults,
                  vname: m.data.vaultName,
                })
              : undefined,
          },
        } as DLink)
    );
    return dlinks as DLink[];
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

  /**Either value or anchorHeader will always be present if the function did not
   * return null. A missing value means that the file containing this link is
   * the value.
   */
  static parseLinkV2(
    linkString: string
  ):
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
    const re = new RegExp(
      "" +
        // alias?
        `(` +
        `(?<alias>${LINK_NAME}(?=\\|))` +
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
      if (node.type === "heading") {
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

  static findHeaders(content: string): Heading[] {
    const remark = MDUtilsV4.remark();
    let out = remark.parse(content);
    let out2: Heading[] = selectAll("heading", out) as Heading[];
    return out2;
  }

  static findBlockAnchors(content: string): BlockAnchor[] {
    const parser = MDUtilsV4.remark().use(blockAnchors);
    const parsed = parser.parse(content);
    return selectAll("blockAnchor", parsed) as BlockAnchor[];
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
    if (node.type !== "heading") {
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
    return node.type === "refLinkV2";
  }

  static oldNoteRef2NewNoteRef(note: NoteProps, changes: NoteChangeEntry[]) {
    return function (this: Processor) {
      return (tree: Node, _vfile: VFile) => {
        let root = tree as DendronASTRoot;
        //@ts-ignore
        let notesRefLegacy: NoteRefNoteV4_LEGACY[] = selectAll("refLink", root);
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
          (ent) => ent.type === "heading" && ent.depth === 1
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
          (ent) => ent.type === "heading" && ent.depth === 1
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
