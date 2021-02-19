import { DEngineClientV2 } from "@dendronhq/common-all";
import {
  AssertUtils,
  ENGINE_HOOKS,
  NoteTestUtilsV4,
  runEngineTestV4,
} from "@dendronhq/common-test-utils";
import _ from "lodash";
import { DConfig } from "../../../config";
import { createEngine } from "../../../enginev2";
import { DendronASTData, DendronASTDest } from "../../types";
import { MDUtilsV4 } from "../../utils";
import { DendronPubOpts } from "../dendronPub";

function proc(
  engine: DEngineClientV2,
  dendron: DendronASTData,
  opts?: DendronPubOpts
) {
  return MDUtilsV4.procFull({ engine, ...dendron, publishOpts: opts });
}

describe("basics", () => {
  let engine: any;
  let dendronData: DendronASTData = {
    dest: DendronASTDest.HTML,
  };

  test("imagePrefix", () => {
    const out = proc(engine, dendronData, {
      assetsPrefix: "bond/",
    }).processSync(`![alt-text](image-url.jpg)`);
    expect(_.trim(out.toString())).toEqual("![alt-text](/bond/image-url.jpg)");
  });

  test("imagePrefix2", () => {
    const out = proc(engine, dendronData, {
      assetsPrefix: "/bond/",
    }).processSync(`![alt-text](/image-url.jpg)`);
    expect(_.trim(out.toString())).toEqual("![alt-text](/bond/image-url.jpg)");
  });

  test("can't publish", async () => {
    await runEngineTestV4(
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
            { ...dendronData, config, vault },
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
      { expect, createEngine, preSetupHook: ENGINE_HOOKS.setupBasic }
    );
  });

  test("can't publish inside note ref", async () => {
    await runEngineTestV4(
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
              ...dendronData,
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
        expect(resp.contents as string).toEqual("<p></p><p></p><p></p>");
      },
      {
        expect,
        createEngine,
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
