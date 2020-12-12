import { DendronError, NotePropsV2, NoteUtilsV2 } from "@dendronhq/common-all";
import _ from "lodash";
import { Processor } from "unified";
import { WikiLinkProps } from "../../topics/markdown";

export const ALIAS_DIVIDER = "|";

export function addError(proc: Processor, err: DendronError) {
  const errors = proc.data("errors") as DendronError[];
  errors.push(err);
  proc().data("errors", errors);
}

export function getNoteOrError(
  notes: NotePropsV2[],
  hint: any
): { error: DendronError | undefined; note: undefined | NotePropsV2 } {
  let error: DendronError | undefined;
  let note: NotePropsV2 | undefined;
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

  static parseAliasLink(link: string) {
    const [alias, value] = link.split("|").map(_.trim);
    return { alias, value: NoteUtilsV2.normalizeFname(value) };
  }

  static parseLink(linkMatch: string) {
    linkMatch = NoteUtilsV2.normalizeFname(linkMatch);
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
