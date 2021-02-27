import { DEngineClientV2 } from "@dendronhq/common-all";
import {
  AssertUtils,
  ENGINE_HOOKS,
  NoteTestUtilsV4,
  runEngineTestV4,
} from "@dendronhq/common-test-utils";
import { createEngine } from "../../../enginev2";
import { DendronASTData, DendronASTDest } from "../../types";
import { MDUtilsV4 } from "../../utils";
import { DendronPubOpts } from "../dendronPub";
import { genDendronData } from "./utils";

// runs all the processes
function proc(
  engine: DEngineClientV2,
  dendron: DendronASTData,
  opts?: DendronPubOpts
) {
  return MDUtilsV4.procFull({
    fname: "PLACEHOLDER",
    engine,
    ...dendron,
    publishOpts: opts,
  });
}

describe("backlinks", () => {
  let dendronData = {
    dest: DendronASTDest.HTML,
  };

  test("basic", async () => {
    await runEngineTestV4(
      async ({ engine, vaults }) => {
        const vault = vaults[0];
        const resp = await MDUtilsV4.procRehype({
          proc: proc(
            engine,
            genDendronData({ ...dendronData, fname: "beta", vault })
          ),
        }).process("");
        // should be one backlink
        expect(resp).toMatchSnapshot();
        expect(
          await AssertUtils.assertInString({
            body: resp.contents as string,
            match: [`<a href="alpha.html">alpha (vault1)</a></p>`],
          })
        ).toBeTruthy();
      },
      { expect, createEngine, preSetupHook: ENGINE_HOOKS.setupLinks }
    );
  });

  test("multiple links", async () => {
    await runEngineTestV4(
      async ({ engine, vaults }) => {
        const vault = vaults[0];
        const resp = await MDUtilsV4.procRehype({
          proc: proc(
            engine,
            genDendronData({ ...dendronData, fname: "one", vault })
          ),
        }).process("");
        // should be one backlink
        expect(resp).toMatchSnapshot();
        expect(
          await AssertUtils.assertInString({
            body: resp.contents as string,
            match: [
              `<a href="three.html">three (vault1)</a>`,
              `<a href="two.html">two (vault1)</a>`,
            ],
          })
        ).toBeTruthy();
      },
      {
        expect,
        createEngine,
        preSetupHook: async (opts) => {
          const { wsRoot, vaults } = opts;
          const vault = vaults[0];
          await NoteTestUtilsV4.createNote({
            fname: "one",
            vault,
            wsRoot,
            body: "One body",
          });
          await NoteTestUtilsV4.createNote({
            fname: "two",
            vault,
            wsRoot,
            body: "[[one]]",
          });
          await NoteTestUtilsV4.createNote({
            fname: "three",
            vault,
            wsRoot,
            body: "[[one]]",
          });
        },
      }
    );
  });
});
