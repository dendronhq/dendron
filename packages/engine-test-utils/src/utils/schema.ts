import { SchemaUtils, VaultUtils } from "@dendronhq/common-all";
import { SetupHookFunction } from "@dendronhq/common-test-utils";
import _ from "lodash";
import fs from "fs-extra";
import path from "path";
import { RunEngineTestFunctionV5 } from "..";

export type SchemaTest = {
  testCase: RunEngineTestFunctionV5;
  preSetupHook: SetupHookFunction;
  name: string;
  testedFname: string;
};

/** Creates tests that check if given fnames match the schema or not.
 *
 * How to use this:
 * - Write the schema to be tested. This is the contents of a schema file that
 *   you would normally write.
 * - Write the checks. The checks are a map: the keys are note fnames, and the
 *   values are whether the schema should match this fname or not. If the value
 *   is a boolean, it will only check if it matches or not. If the value is a
 *   string, then a schema with that value as the id should match.
 *
 * See [[../packages/engine-test-utils/src/__tests__/common-all/dnode.spec.ts#L250]] for examples.
 */
export function makeSchemaTests({
  schema,
  checks,
  expect,
}: {
  schema: string;
  checks: { [name: string]: string | boolean };
  expect: any;
}): SchemaTest[] {
  return Object.entries(checks).map(([notePath, expected]): SchemaTest => {
    let testOutcome: string;
    if (!expected) testOutcome = "NOT match";
    else if (_.isString(expected)) testOutcome = `match ${expected}`;
    else testOutcome = "match";
    return {
      testCase: async ({ engine }) => {
        const { schema } =
          (await SchemaUtils.matchPath({
            notePath,
            engine,
          })) || {};
        if (!expected) {
          expect(schema).toBeUndefined();
        } else if (_.isString(expected)) {
          expect(schema?.id).toEqual(expected);
        } else {
          expect(schema).toBeTruthy();
        }
        return true;
      },
      preSetupHook: async ({ wsRoot, vaults }) => {
        const schemaPath = path.join(
          wsRoot,
          VaultUtils.getRelPath(vaults[0]),
          "root.schema.yml"
        );
        await fs.writeFile(schemaPath, schema);
      },
      name: `THEN ${notePath} should ${testOutcome}`,
      testedFname: notePath,
    };
  });
}
