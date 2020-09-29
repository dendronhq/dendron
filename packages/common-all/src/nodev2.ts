import _ from "lodash";
import { DNodePropsV2, SchemaPropsDictV2 } from "./types";

export class SchemaUtilsV2 {
  /**
   *
   * @param noteOrPath
   * @param schemas
   * @param opts
   *   - matchNamespace: should match exact namespace note (in addition to wildcard), default: false
   *   - matchPrefix: allow prefix match, default: false
   */
  static matchNote(
    noteOrPath: DNodePropsV2 | string,
    schemas: SchemaPropsDictV2 | DNodePropsV2[],
    opts?: { matchNamespace?: boolean; matchPrefix?: boolean }
  ): DNodePropsV2 {
    const cleanOpts = _.defaults(opts, {
      matchNamespace: true,
      matchPrefix: false,
    });
    const schemaList = _.isArray(schemas) ? schemas : _.values(schemas);
    const notePath = _.isString(noteOrPath) ? noteOrPath : noteOrPath.path;
    const notePathClean = notePath.replace(/\./g, "/");
    let match: Schema | undefined;
    _.find(schemaList, (schemaDomain) => {
      return _.some(schemaDomain.nodes as Schema[], (schema) => {
        const patternMatch = schema.patternMatch;
        if ((schema as Schema).namespace && cleanOpts.matchNamespace) {
          if (minimatch(notePathClean, _.trimEnd(patternMatch, "/*"))) {
            match = schema as Schema;
            return true;
          }
        }
        if (minimatch(notePathClean, patternMatch)) {
          match = schema as Schema;
          return true;
        } else {
          return false;
        }
      });
    });
    if (_.isUndefined(match)) {
      return Schema.createUnkownSchema();
    }
    return match;
  }
}
