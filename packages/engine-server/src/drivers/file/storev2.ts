import { DNodePropsV2 } from "@dendronhq/common-all";
import { note2File } from "@dendronhq/common-server";
import { FileStorage } from "./store";

export class StorageV2 extends FileStorage {
  // @ts-ignore
  _writeFile(node: DNodePropsV2) {
    if (node.type === "schema") {
      throw Error(" not implemented");
    }
    return note2File(node, this.opts.root);
  }
}
