import { DStore, DLogger } from "@dendronhq/common-all";

export class ParserBase {
  constructor(public opts: { store: DStore; logger: DLogger }) {}

  get logger() {
    return this.opts.logger;
  }
}
