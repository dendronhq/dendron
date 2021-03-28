import {
  CONSTANTS,
  DendronError,
  getSlugger,
  NoteChangeEntry,
  NoteProps,
  NoteUtils,
} from "@dendronhq/common-all";
import { normalizev2 } from "@dendronhq/engine-server";
import _ from "lodash";
import { Heading, Root } from "mdast";
import { Processor } from "unified";
import { Node } from "unist";
import { selectAll } from "unist-util-select";
import { VFile } from "vfile";
import { WikiLinkProps } from "../../topics/markdown";
import {
  DendronASTRoot,
  DendronASTTypes,
  NoteRefNoteV4_LEGACY,
} from "../types";

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
    error = new DendronError({ msg: `no note found. ${hint}` });
    return { error, note };
  }
  if (notes.length > 1) {
    error = new DendronError({ msg: `multiple notes found for link: ${hint}` });
    return { error, note };
  }
  if (notes.length < 1) {
    error = new DendronError({
      msg: `no notes found for link: ${JSON.stringify(hint)}`,
    });
    return { error, note };
  }
  note = notes[0];
  return { error, note };
}

export class LinkUtils {
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

  static parseLinkV2(linkString: string) {
    const LINK_NAME = "[^#\\|>]+";
    const re = new RegExp(
      "" +
        // alias?
        `(` +
        `(?<alias>${LINK_NAME}(?=\\|))` +
        "\\|" +
        ")?" +
        // name
        `(?<value>${LINK_NAME})` +
        // anchor?
        `(#(?<anchor>${LINK_NAME}))?` +
        // filters?
        `(>(?<filtersRaw>.*))?`,
      "i"
    );
    const out = linkString.match(re);
    if (out) {
      let { alias, value, anchor } = out.groups as any;
      let vaultName: string | undefined;
      ({ vaultName, link: value } = this.parseDendronURI(value));
      if (!alias) {
        alias = value;
      }
      alias = _.trim(alias);
      value = _.trim(value);
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

export class RemarkUtils {
  static oldNoteRef2NewNoteRef(note: NoteProps, changes: NoteChangeEntry[]) {
    return function (this: Processor) {
      return (tree: Node, _vfile: VFile) => {
        let root = tree as DendronASTRoot;
        //@ts-ignore
        let notesRefLegacy: NoteRefNoteV4_LEGACY[] = selectAll("refLink", root);
        const slugger = getSlugger();
        notesRefLegacy.map((noteRefLegacy) => {
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
        changes.push({
          note,
          status: "update",
        });
        // if (out2.length > 0) {
        //   // const noteRefLegacy = root.children.splice(idx, 1)[0] as unknown as  NoteRefNoteV4_LEGACY;
        //   const noteRefLegacy = out2[0];
        //   // root.children[idx] as unknown as NoteRefNoteV4_LEGACY;
        //   // const noteRefNew: NoteRefNoteV4= {
        //   //   type: DendronASTTypes.REF_LINK_V2,
        //   //   data: {
        //   //     link: noteRefLegacy.data.link,
        //   //   },
        //   //   value: noteRefLegacy.value
        //   // }
        //   // @ts-ignore;
        //   noteRefLegacy.type = DendronASTTypes.REF_LINK_V2;
        //   // // @ts-ignore
        //   // root.children.splice(idx, 1, noteRefNew);
        //   changes.push({
        //     note,
        //     status: "update",
        //   });
        // }
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
