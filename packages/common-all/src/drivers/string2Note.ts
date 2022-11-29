import matter from "gray-matter";
import YAML from "js-yaml";
import _ from "lodash";
import { DNodeUtils } from "../dnode";
import { DNodeImplicitPropsEnum } from "../types";
import { DVault } from "../types/DVault";
import { genHash } from "../utils";

/**
 * Convert a string to a set of NoteProps
 * @param calculateHash - when set, add `contentHash` property to the note
 *  Default: false
 * @returns
 */
export function string2Note({
  content,
  fname,
  vault,
  calculateHash,
}: {
  content: string;
  fname: string;
  vault: DVault;
  calculateHash?: boolean;
}) {
  const options: any = {
    engines: {
      yaml: {
        parse: (s: string) => YAML.load(s),
        stringify: (s: string) => YAML.dump(s),
      },
    },
  };
  const { data, content: body } = matter(content, options);
  if (data?.title) data.title = _.toString(data.title);
  if (data?.id) data.id = _.toString(data.id);
  const custom = DNodeUtils.getCustomProps(data);

  const contentHash = calculateHash ? genHash(content) : undefined;
  const note = DNodeUtils.create({
    ..._.omit(data, Object.values(DNodeImplicitPropsEnum)),
    custom,
    fname,
    body,
    type: "note",
    vault,
    contentHash,
  });

  // Any note parsed from a real string cannot be a stub - stubs are only
  // virtual notes to fill in hierarchy gaps. Just omit the property - the value
  // defaults to 'false'
  return _.omit(note, "stub");
}
