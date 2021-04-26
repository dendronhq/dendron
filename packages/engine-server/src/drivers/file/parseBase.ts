import { DStore } from "@dendronhq/common-all";
import { DLogger } from "@dendronhq/common-server";

export class ParserBase {
  constructor(public opts: { store: DStore; logger: DLogger }) {}

  get logger() {
    return this.opts.logger;
  }
}
