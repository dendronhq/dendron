import matter from "gray-matter";
import YAML from "js-yaml";
import _ from "lodash";
import { DNodeUtils } from "../dnode";
import { DNodeImplicitPropsEnum } from "../types";
import { DVault } from "../types/DVault";
import { genHash } from "../utils";

/**
 * NOTE: Temporarily duplicated from common-server/filesv2.ts to get Dendron Web
 * Extension working
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
  return note;
}
