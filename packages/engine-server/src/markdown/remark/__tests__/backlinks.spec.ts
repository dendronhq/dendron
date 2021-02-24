import { DEngineClientV2 } from "@dendronhq/common-all";
import { ENGINE_HOOKS, runEngineTestV4 } from "@dendronhq/common-test-utils";
import { createEngine } from "../../../enginev2";
import { DendronASTData, DendronASTDest } from "../../types";
import { MDUtilsV4 } from "../../utils";
import { DendronPubOpts } from "../dendronPub";

// runs all the processes
function proc(
  engine: DEngineClientV2,
  dendron: DendronASTData,
  opts?: DendronPubOpts
) {
  return MDUtilsV4.procFull({ engine, ...dendron, publishOpts: opts });
}

describe("backlinks", () => {
  let dendronData: DendronASTData = {
    dest: DendronASTDest.HTML
  };

  test("backlinks render", async () => {
    await runEngineTestV4(
      async ({ engine, vaults }) => {
        const vault = vaults[0];
        const resp = await MDUtilsV4.procRehype({
          proc: proc(engine, { ...dendronData, fname: "alpha", vault })
        }).process("[[test]]");
        expect(resp).toMatchSnapshot();
      },
      { expect, createEngine, preSetupHook: ENGINE_HOOKS.setupLinks }
    );
  });
});
