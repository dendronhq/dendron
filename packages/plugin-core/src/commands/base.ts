import { createLogger } from "@dendronhq/common-server";

export abstract class BaseCommand<TOpts> {
  public L: ReturnType<typeof createLogger>;

  constructor(name?: string) {
    this.L = createLogger(name || "Command");
  }
  abstract async execute(opts: TOpts): Promise<any>;
}
