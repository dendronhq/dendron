import { DEngineClient } from "@dendronhq/common-all";
import {
  AssertUtils,
  ENGINE_HOOKS,
  NoteTestUtilsV4,
} from "@dendronhq/common-test-utils";
import {
  DConfig,
  DendronASTData,
  DendronASTDest,
  DendronPubOpts,
  MDUtilsV4,
} from "@dendronhq/engine-server";
import { testWithEngine } from "../../../engine";
import { checkVFile } from "./utils";

function proc(
  engine: DEngineClient,
  dendron: DendronASTData,
  opts?: DendronPubOpts
) {
  return MDUtilsV4.procFull({
    engine,
    ...dendron,
    publishOpts: opts,
  });
}

describe("dendronPub", () => {
  describe("prefix", async () => {
    testWithEngine("imagePrefix", async ({ engine, vaults }) => {
      const out = proc(
        engine,
        {
          fname: "foo",
          dest: DendronASTDest.HTML,
          vault: vaults[0],
          config: engine.config,
        },
        {
          assetsPrefix: "bond/",
        }
      ).processSync(`![alt-text](image-url.jpg)`);
      await checkVFile(out, "![alt-text](/bond/image-url.jpg)");
    });

    testWithEngine(
      "imagePrefix with forward slash",
      async ({ engine, vaults }) => {
        const out = proc(
          engine,
          {
            fname: "foo",
            dest: DendronASTDest.HTML,
            vault: vaults[0],
            config: engine.config,
          },
          {
            assetsPrefix: "/bond/",
          }
        ).processSync(`![alt-text](/image-url.jpg)`);
        await checkVFile(out, "![alt-text](/bond/image-url.jpg)");
      }
    );
  });

  describe("no publish", () => {
    testWithEngine(
      "basic",
      async ({ engine, vaults }) => {
        const config = DConfig.genDefaultConfig();
        config.site = {
          siteHierarchies: ["foo"],
          siteRootDir: "foo",
        };
        const resp = await MDUtilsV4.procRehype({
          proc: proc(
            engine,
            {
              fname: "foo",
              dest: DendronASTDest.HTML,
              vault: vaults[0],
              config,
            },
            {
              wikiLinkOpts: { useId: true },
              transformNoPublish: true,
            }
          ),
        }).process(`[[an alias|bar]]`);
        expect(resp).toMatchSnapshot();
        expect(
          await AssertUtils.assertInString({
            body: resp.contents as string,
            match: ["a data-toggle="],
          })
        ).toBeTruthy();
      },
      { preSetupHook: ENGINE_HOOKS.setupBasic }
    );

    testWithEngine(
      "inside note ref, wikilink",
      async ({ engine, vaults }) => {
        const vault = vaults[0];
        const config = DConfig.genDefaultConfig();
        config.site = {
          siteHierarchies: ["foo"],
          siteRootDir: "foo",
        };
        const resp = await MDUtilsV4.procRehype({
          proc: proc(
            engine,
            {
              dest: DendronASTDest.HTML,
              config,
              vault,
              fname: "gamma",
              shouldApplyPublishRules: true,
            },
            {
              wikiLinkOpts: { useId: true },
              transformNoPublish: true,
            }
          ),
        }).process("[[alpha]]");
        expect(resp).toMatchSnapshot();
        expect(
          await AssertUtils.assertInString({
            body: resp.contents as string,
            match: ["This page has not yet sprouted"],
          })
        ).toBeTruthy();
      },
      {
        preSetupHook: async (opts) => {
          await ENGINE_HOOKS.setupLinks(opts);
          await NoteTestUtilsV4.createNote({
            fname: "gamma",
            body: `![[alpha]]`,
            vault: opts.vaults[0],
            wsRoot: opts.wsRoot,
          });
        },
      }
    );

    testWithEngine(
      "inside note ref, note ref link",
      async ({ engine, vaults }) => {
        const vault = vaults[0];
        const config = DConfig.genDefaultConfig();
        config.site = {
          siteHierarchies: ["foo"],
          siteRootDir: "foo",
        };
        const resp = await MDUtilsV4.procRehype({
          proc: proc(
            engine,
            {
              dest: DendronASTDest.HTML,
              config,
              vault,
              fname: "gamma",
              shouldApplyPublishRules: true,
            },
            {
              wikiLinkOpts: { useId: true },
              transformNoPublish: true,
            }
          ),
        }).process("![[alpha]]");
        expect(resp).toMatchSnapshot();
        await checkVFile(resp, "<p></p><p></p>");
      },
      {
        preSetupHook: async (opts) => {
          await ENGINE_HOOKS.setupLinks(opts);
          await NoteTestUtilsV4.createNote({
            fname: "gamma",
            body: `![[alpha]]`,
            vault: opts.vaults[0],
            wsRoot: opts.wsRoot,
          });
        },
      }
    );
  });
});
