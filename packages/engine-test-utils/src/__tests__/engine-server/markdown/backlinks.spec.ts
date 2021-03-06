import { DEngineClientV2 } from "@dendronhq/common-all";
import { tmpDir } from "@dendronhq/common-server";
import {
  AssertUtils,
  ENGINE_HOOKS,
  NoteTestUtilsV4,
} from "@dendronhq/common-test-utils";
import {
  DendronASTData,
  DendronASTDest,
  DendronPubOpts,
  MDUtilsV4,
} from "@dendronhq/engine-server";
import { ConfigUtils, runEngineTestV5 } from "../../..";

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
  const dest = DendronASTDest.HTML;
  let siteRootDir: string;

  beforeEach(() => {
    siteRootDir = tmpDir().name;
  });

  test("basic", async () => {
    await runEngineTestV5(
      async ({ engine, vaults }) => {
        const vault = vaults[0];
        const resp = await MDUtilsV4.procRehype({
          proc: proc(engine, {
            fname: "beta",
            vault,
            dest,
            config: engine.config,
          }),
        }).process("");
        // should be one backlink
        expect(resp).toMatchSnapshot();
        expect(
          await AssertUtils.assertInString({
            body: resp.contents as string,
            match: [`<a href="alpha.html">Alpha (vault1)</a>`],
          })
        ).toBeTruthy();
      },
      { expect, preSetupHook: ENGINE_HOOKS.setupLinks }
    );
  });

  test("backlink to home page", async () => {
    await runEngineTestV5(
      async ({ engine, vaults }) => {
        const alphaNote = engine.notes["alpha"];
        const resp = await MDUtilsV4.procHTML({
          config: engine.config,
          engine,
          fname: "beta",
          vault: vaults[0],
          noteIndex: alphaNote,
        }).process("");
        // should be one backlink
        expect(resp).toMatchSnapshot();
        expect(
          await AssertUtils.assertInString({
            body: resp.contents as string,
            match: [`<a href="https://foo.com">Alpha (vault1)</a>`],
          })
        ).toBeTruthy();
      },
      {
        expect,
        preSetupHook: async (opts) => {
          const { wsRoot } = opts;
          await ENGINE_HOOKS.setupLinks(opts);
          ConfigUtils.withConfig(
            (config) => {
              config.site = {
                siteHierarchies: ["alpha"],
                siteNotesDir: "docs",
                siteUrl: "https://foo.com",
                siteRootDir,
              };
              return config;
            },
            {
              wsRoot,
            }
          );
        },
      }
    );
  });

  test("multiple links", async () => {
    await runEngineTestV5(
      async ({ engine, vaults }) => {
        const vault = vaults[0];
        const resp = await MDUtilsV4.procRehype({
          proc: proc(engine, {
            fname: "one",
            vault,
            dest,
            config: engine.config,
          }),
        }).process("");
        // should be one backlink
        expect(resp).toMatchSnapshot();
        expect(
          await AssertUtils.assertInString({
            body: resp.contents as string,
            match: [
              `<a href="three.html">Three (vault1)</a>`,
              `<a href="two.html">Two (vault1)</a>`,
            ],
          })
        ).toBeTruthy();
      },
      {
        expect,
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
