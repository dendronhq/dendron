import {
  DEngineClientV2,
  DEngineInitRespV2,
  ERROR_CODES,
} from "@dendronhq/common-all";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { NodeTestPresetsV2 } from "..";
import { TestPresetEntry } from "../utils";

const BAD_SCHEMA = new TestPresetEntry({
  label: "schema with no root node",
  before: async ({ vaultDir }: { vaultDir: string }) => {
    await NodeTestPresetsV2.createOneNoteOneSchemaPresetWithBody({ vaultDir });
    fs.writeFileSync(
      path.join(vaultDir, "hello.schema.yml"),
      `
schemas:
- id: hello
  title: hello`,
      { encoding: "utf8" }
    );
  },
  results: async ({
    engine,
    resp,
  }: {
    resp: DEngineInitRespV2;
    engine: DEngineClientV2;
  }) => {
    const schemas = _.keys(engine.schemas);
    const scenarios = [
      {
        actual: schemas,
        expected: ["foo", "root"],
        msg: "bad schema not included",
      },
      { actual: resp.error?.code, expected: ERROR_CODES.MINOR },
    ];
    return scenarios;
  },
});

export const INIT_TEST_PRESETS = {
  BAD_SCHEMA,
};
