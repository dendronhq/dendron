import { FileType, Uri } from "vscode";

import { DendronFileSystemProvider } from "../fsProvider";
import _ from "lodash";

export const fnameToUri = async (
  fname: string,
  opts?: { checkIfDirectoryFile?: boolean }
): Promise<Uri> => {
  opts = _.defaults(opts, { checkIfDirectoryFile: true });
  let uri = Uri.parse(`denfs:/${fname.replace(/\./g, "/")}`);
  if (opts.checkIfDirectoryFile) {
    const fs = await DendronFileSystemProvider.getOrCreate();
    if (fs.stat(uri).type === FileType.Directory) {
      uri = await fnameToUri(fname + ".index");
    }
  }
  return uri;
};
