import { NoteProps } from "@dendronhq/common-all";
import execa from "execa";
import _ from "lodash";
export { CommentJSONObject, CommentJSONValue } from "comment-json";

export type DHookFunction = (opts: {
  note: NoteProps;
  execa: typeof execa;
  _: typeof _;
}) => Promise<NoteProps>;
