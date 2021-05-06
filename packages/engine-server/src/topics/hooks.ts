import { NoteProps } from "@dendronhq/common-all";
import execa from "execa";
import _ from "lodash";

export const requireHook = async ({
  note,
  fpath,
}: {
  note: NoteProps;
  fpath: string;
}) => {
  return await require(fpath)({ note, execa, _ });
};
