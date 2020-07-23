import { createLogger } from "@dendronhq/common-server";

export abstract class BaseCommand<TOpts, TOut = any, TInput = any> {
  public L: ReturnType<typeof createLogger>;

  constructor(name?: string) {
    this.L = createLogger(name || "Command");
  }

  async gatherInputs(): Promise<TInput|undefined> {
    return {} as any;
  }

  abstract async execute(opts: TOpts): Promise<TOut>;
}
