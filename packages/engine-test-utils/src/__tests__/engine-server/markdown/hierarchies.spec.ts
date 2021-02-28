import { DEngineClientV2, DVault } from "@dendronhq/common-all";
import {
  DendronASTDest,
  hierarchies,
  MDUtilsV4,
} from "@dendronhq/engine-server";
import { testWithEngine } from "../../../engine";
import { checkVFile } from "./utils";

function cproc(opts: { engine: DEngineClientV2; vault: DVault }) {
  const { engine, vault } = opts;
  const proc = MDUtilsV4.procFull({
    dest: DendronASTDest.HTML,
    engine,
    vault,
    fname: "foo",
  }).use(hierarchies);
  return proc;
}

describe("hierarchies", () => {
  describe("single", () => {
    testWithEngine("basic", async ({ engine, vaults }) => {
      const vault = vaults[0];
      const content = engine.notes["foo"].body;
      const resp = await cproc({ engine, vault }).process(content);
      await checkVFile(resp, "[Ch1](foo.ch1.html)");
    });
  });
});
