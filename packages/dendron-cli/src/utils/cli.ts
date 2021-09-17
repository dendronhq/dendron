import _ from "lodash";

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
  static objectConfig2StringConfig = (ent: any) => {
    return _.map(ent, (v, k) => {
      return `${k}=${v}`;
    })
      .filter((ent) => !_.isUndefined(ent))
      .join(",");
  };
}
