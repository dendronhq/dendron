import _ from "lodash";

export class MigrationUtils {
  /**
   * clean up an object recursively with given predicate.
   * @param obj a plain object
   * @param pred predicate to use for recursively omitting
   * @returns obj, with properties omitted by pred
   */
  static deepCleanObjBy(obj: any, pred: Function): any {
    const out = _.omitBy(obj, pred);
    _.keys(out).forEach((key) => {
      if (_.isPlainObject(obj[key])) {
        obj[key] = MigrationUtils.deepCleanObjBy(obj[key], pred);
      }
    });
    return out;
  }
}
