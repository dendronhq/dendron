import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import _ from "lodash";
import { runEngineTestV5 } from "../../engine";

async function genHierarchy(opts: {
  prefix?: string;
  ceil: number;
}): Promise<string[]> {
  const { prefix, ceil } = opts;
  return Promise.all(
    _.range(0, ceil).map(async (ent) => {
      return [prefix, ent].filter((ent) => !_.isUndefined(ent)).join(".");
    })
  );
}

describe("engine perf", () => {
  // regular: 400ms
  // before: 285
  // 261ms
  test.skip("basic", async () => {
    /**
     * Evenly spread out
     * Hierarchies:
     * - 0-100
     *  - 0-5
     */
    await runEngineTestV5(
      async ({ engineInitDuration }) => {
        expect(engineInitDuration < 2100).toBeTruthy();
        // expect(engineInitDuration).toMatchSnapshot("BOND");
        // const vpath = vault2Path({ wsRoot, vault: vaults[0] });
        // expect(fs.readdirSync(vpath)).toMatchSnapshot();
      },
      {
        preSetupHook: async ({ vaults, wsRoot }) => {
          const vault = vaults[0];
          const seed = await genHierarchy({ ceil: 50 });
          await Promise.all(
            seed.map(async (ent) => {
              await NoteTestUtilsV4.createNote({ fname: ent, wsRoot, vault });
              const out = await genHierarchy({ ceil: 40, prefix: ent });
              Promise.all(
                out.map((fname) => {
                  return NoteTestUtilsV4.createNote({ fname, wsRoot, vault });
                })
              );
            })
          );
        },
        expect,
      }
    );
  });
});
