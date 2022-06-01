import YAML from "js-yaml";
import _ from "lodash";
import { SchemaData, SchemaTemplate } from "./types";

export type SchemaInMaking = {
  id?: string;
  title?: string;
  parent?: string;
  pattern?: string;
  template?: SchemaTemplate;
  children?: SchemaInMaking[];
  desc?: string;
};

export type SchemaToken = Required<Pick<SchemaData, "pattern">> &
  Pick<SchemaData, "template"> &
  Pick<SchemaData, "desc">;

/**
 * Utils for generating a Schema **JSON** file.  For working with Schema
 * objects, see SchemaUtils.
 */
export class SchemaCreationUtils {
  static getBodyForTokenizedMatrix({
    topLevel,
    tokenizedMatrix,
  }: {
    topLevel: SchemaInMaking;
    tokenizedMatrix: SchemaToken[][];
  }): string {
    for (let r = 0; r < tokenizedMatrix.length; r += 1) {
      const tokenizedRow = tokenizedMatrix[r];

      let currParent = topLevel;
      // Top level is already taken care of hence we start out and index 1.
      for (let i = 1; i < tokenizedRow.length; i += 1) {
        if (_.isUndefined(currParent["children"])) {
          currParent.children = [];
        }
        const currPattern = tokenizedRow[i];

        if (
          currParent.children?.some((ch) => ch.pattern === currPattern.pattern)
        ) {
          // There is already our pattern in the schema schema hierarchy, so we should
          // not double add it, find the matching element and assign it as parent for next iteration.
          currParent = currParent.children?.filter(
            (ch) => ch.pattern === currPattern.pattern
          )[0];
        } else {
          let curr: SchemaInMaking;

          if (currPattern.template) {
            curr = {
              pattern: currPattern.pattern,
              template: currPattern.template,
            };
          } else {
            curr = {
              pattern: currPattern.pattern,
            };
          }
          if (currPattern.desc) {
            curr["desc"] = currPattern.desc;
          }
          currParent.children?.push(curr);
          currParent = curr;
        }
      }
    }

    return YAML.dump({
      version: 1,
      imports: [],
      schemas: [topLevel],
    });
  }
}
