import { createLogger } from "@dendronhq/common-server";

export abstract class BaseCommand<TOpts, TOut = any> {
  public L: ReturnType<typeof createLogger>;

  constructor(name?: string) {
    this.L = createLogger(name || "Command");
  }
  abstract async execute(opts: TOpts): Promise<TOut>;
}
