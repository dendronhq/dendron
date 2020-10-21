declare module "remark-abbr" {
  import { Plugin } from "unified";

  namespace remarkAbbr {
    type Abbr = Plugin<[Options?]>;

    interface Options {
      expandFirst?: boolean;
    }
  }

  const plugin: remarkAbbr.Abbr;
  export = plugin;
}
