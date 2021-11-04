import _ from "lodash";
import ora from "ora";
import { DENDRON_EMOJIS } from "@dendronhq/common-all";

export class CLIUtils {
  /**
   * Takes an object like
   *     {
   *     		foo: "42",
   *     		bar: 10
   *     }
   * and returns "foo=42,bar=10"
   * @param ent: config object
   * @returns
   */
  static objectConfig2StringConfig = (ent: any): string => {
    return (
      _.map(ent, (v, k) => {
        if (_.isUndefined(v)) {
          return undefined;
        } else {
          return `${k}=${v}`;
        }
      }).filter((ent) => !_.isUndefined(ent)) as string[]
    ).join(",");
  };
}

export class SpinnerUtils {
  /**
   * Given a Ora spinner, render given text with optional symbol
   * Continue spinning.
   * @param opts
   */
  static renderAndContinue(opts: {
    spinner: ora.Ora;
    text?: string;
    symbol?: string;
  }) {
    const { spinner, text, symbol } = opts;
    spinner.stopAndPersist({
      text: text || undefined,
      symbol: symbol || DENDRON_EMOJIS.SEEDLING,
    });
    spinner.start();
  }
}
