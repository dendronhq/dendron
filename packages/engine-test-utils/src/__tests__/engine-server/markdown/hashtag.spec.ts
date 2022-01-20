import {
  AssertUtils,
  TestPresetEntryV4,
  NoteTestUtilsV4,
} from "@dendronhq/common-test-utils";
import {
  DendronASTDest,
  DendronASTTypes,
  HashTag,
  MDUtilsV5,
  ProcMode,
  UnistNode,
} from "@dendronhq/engine-server";
import _ from "lodash";
import { ConfigUtils, NoteProps } from "@dendronhq/common-all";
import { runEngineTestV5 } from "../../../engine";
import { ENGINE_HOOKS } from "../../../presets";
import {
  checkNotInVFile,
  checkVFile,
  createProcForTest,
  createProcTests,
  ProcTests,
} from "./utils";
import { TestConfigUtils } from "../../..";
import { TestUnifiedUtils } from "../../../utils";

const { getDescendantNode } = TestUnifiedUtils;

function proc() {
  return MDUtilsV5.procRehypeParse({
    mode: ProcMode.NO_DATA,
  });
}

function runAllTests(opts: { name: string; testCases: ProcTests[] }) {
  const { name, testCases } = opts;
  describe(name, () => {
    test.each(
      testCases.map((ent) => [`${ent.dest}: ${ent.name}`, ent.testCase])
      // @ts-ignore
    )("%p", async (_key, testCase: TestPresetEntryV4) => {
      await runEngineTestV5(testCase.testFunc, {
        expect,
        preSetupHook: testCase.preSetupHook,
      });
    });
  });
}

function getHashtag(node: UnistNode): HashTag {
  return getDescendantNode<HashTag>(expect, node, 0, 0);
}

describe("hashtag", () => {
  describe("parse", () => {
    test("parses basic hashtag", () => {
      const resp = proc().parse("#my-hash-tag");
      expect(getHashtag(resp).type).toEqual(DendronASTTypes.HASHTAG);
      expect(getHashtag(resp).fname).toEqual("tags.my-hash-tag");
    });

    test("parses hashtag with hierarchy", () => {
      const resp = proc().parse("#my.hash.tag0");
      expect(getHashtag(resp).type).toEqual(DendronASTTypes.HASHTAG);
      expect(getHashtag(resp).fname).toEqual("tags.my.hash.tag0");
    });

    test("doesn't parse hashtag inside inline code block", () => {
      const resp = proc().parse("`#my-hash-tag`");
      expect(getHashtag(resp).type).toEqual("inlineCode");
    });

    test("doesn't parse hash inside a link", () => {
      const resp = proc().parse("[[#my-hash-tag]]");
      expect(getHashtag(resp).type).toEqual(DendronASTTypes.WIKI_LINK);
    });

    test("parses a hashtag in the middle of a paragraph", () => {
      const resp = proc().parse("Lorem ipsum #my-hash-tag dolor amet.");
      expect(getDescendantNode(expect, resp, 0, 1).type).toEqual(
        DendronASTTypes.HASHTAG
      );
      // @ts-ignore
      expect(getDescendantNode(expect, resp, 0, 1).value).toEqual(
        "#my-hash-tag"
      );
    });

    test("doesn't parse hashtag starting with number", () => {
      const resp = proc().parse("#123-hash-tag");
      expect(getDescendantNode(expect, resp, 0, 0).type).toEqual(
        DendronASTTypes.TEXT
      );
    });

    test("doesn't parse trailing punctuation", () => {
      const resp1 = proc().parse(
        "Dolorem vero sed sapiente #dolores. Et quam id maxime et ratione."
      );
      expect(getDescendantNode(expect, resp1, 0, 1).type).toEqual(
        DendronASTTypes.HASHTAG
      );
      // @ts-ignore
      expect(getDescendantNode(expect, resp1, 0, 1).value).toEqual("#dolores");

      const resp2 = proc().parse(
        "Dolorem vero sed sapiente #dolores, et quam id maxime et ratione."
      );
      expect(getDescendantNode(expect, resp2, 0, 1).type).toEqual(
        DendronASTTypes.HASHTAG
      );
      // @ts-ignore
      expect(getDescendantNode(expect, resp2, 0, 1).value).toEqual("#dolores");

      const resp3 = proc().parse(
        "Dolorem vero sed (sapiente #dolores) et quam id maxime et ratione."
      );
      expect(getDescendantNode(expect, resp3, 0, 1).type).toEqual(
        DendronASTTypes.HASHTAG
      );
      // @ts-ignore
      expect(getDescendantNode(expect, resp3, 0, 1).value).toEqual("#dolores");
    });

    test("doesn't parse trailing unicode punctuation", () => {
      const resp1 = proc().parse("彼女に「#よろしく」言って下さい。");
      expect(getDescendantNode(expect, resp1, 0, 1).type).toEqual(
        DendronASTTypes.HASHTAG
      );
      // @ts-ignore
      expect(getDescendantNode(expect, resp1, 0, 1).value).toEqual("#よろしく");
    });
  });

  describe("rendering", () => {
    const hashtag = "#my-hash.tag0";

    const SIMPLE = createProcTests({
      name: "simple",
      setupFunc: async ({ engine, vaults, extra }) => {
        const proc2 = createProcForTest({
          engine,
          dest: extra.dest,
          vault: vaults[0],
        });
        const resp = await proc2.process(hashtag);
        return { resp };
      },
      verifyFuncDict: {
        [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
          const { resp } = extra;
          return [
            {
              actual: await AssertUtils.assertInString({
                body: resp.toString(),
                match: [hashtag],
              }),
              expected: true,
            },
          ];
        },
        [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
          const { resp } = extra;
          return [
            {
              actual: await AssertUtils.assertInString({
                body: resp.toString(),
                match: [`[${hashtag}](tags.my-hash.tag0)`],
              }),
              expected: true,
            },
          ];
        },
        [DendronASTDest.MD_ENHANCED_PREVIEW]: async ({ extra }) => {
          const { resp } = extra;
          return [
            {
              actual: await AssertUtils.assertInString({
                body: resp.toString(),
                match: [`[${hashtag}](tags.my-hash.tag0.md)`],
              }),
              expected: true,
            },
          ];
        },
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(
            resp,
            '<a class="color-tag" style="--tag-color: #c95efb;" href="tags.my-hash.tag0.html">#my-hash.tag0</a>'
          );
        },
      },
      preSetupHook: ENGINE_HOOKS.setupBasic,
    });

    describe("colors", () => {
      test("with color", async () => {
        let note: NoteProps;
        await runEngineTestV5(
          async ({ engine }) => {
            const proc = createProcForTest({
              engine,
              dest: DendronASTDest.HTML,
              vault: note.vault,
            });
            const resp = await proc.process(`#color`);
            await checkVFile(
              resp,
              '<a class="color-tag" style="--tag-color: #FF0033;" href="tags.color.html">#color</a>'
            );
          },
          {
            expect,
            preSetupHook: async ({ wsRoot, vaults }) => {
              note = await NoteTestUtilsV4.createNote({
                fname: "tags.color",
                wsRoot,
                vault: vaults[0],
                props: { color: "#FF0033" },
              });
            },
          }
        );
      });

      test("when configured with noRandomlyGeneratedColors, only uses explicit colors", async () => {
        let note: NoteProps;
        await runEngineTestV5(
          async ({ engine }) => {
            const proc = createProcForTest({
              engine,
              dest: DendronASTDest.HTML,
              vault: note.vault,
            });
            const resp = await proc.process(`#color #uncolored`);
            await checkVFile(
              resp,
              '<a class="color-tag" style="--tag-color: #FF0033;" href="tags.color.html">#color</a>',
              '<a href="tags.uncolored.html">#uncolored</a>'
            );
          },
          {
            expect,
            preSetupHook: async ({ wsRoot, vaults }) => {
              note = await NoteTestUtilsV4.createNote({
                fname: "tags.color",
                wsRoot,
                vault: vaults[0],
                props: { color: "#FF0033" },
              });
              note = await NoteTestUtilsV4.createNote({
                fname: "tags.uncolored",
                wsRoot,
                vault: vaults[0],
              });
              TestConfigUtils.withConfig(
                (config) => {
                  ConfigUtils.setPublishProp(
                    config,
                    "enableRandomlyColoredTags",
                    true
                  );
                  return config;
                },
                { wsRoot }
              );
            },
          }
        );
      });

      test("with color cascading from parent, self missing", async () => {
        let note: NoteProps;
        await runEngineTestV5(
          async ({ engine }) => {
            const proc = createProcForTest({
              engine,
              dest: DendronASTDest.HTML,
              vault: note.vault,
            });
            const resp = await proc.process(`#parent.color`);
            await checkVFile(
              resp,
              '<a class="color-tag" style="--tag-color: #FF0033;" href="tags.parent.color.html">#parent.color</a>'
            );
          },
          {
            expect,
            preSetupHook: async ({ wsRoot, vaults }) => {
              note = await NoteTestUtilsV4.createNote({
                fname: "tags.parent",
                wsRoot,
                vault: vaults[0],
                props: { color: "#FF0033" },
              });
            },
          }
        );
      });

      test("with color cascading from parent, self exists", async () => {
        let note: NoteProps;
        await runEngineTestV5(
          async ({ engine }) => {
            const proc = createProcForTest({
              engine,
              dest: DendronASTDest.HTML,
              vault: note.vault,
            });
            const resp = await proc.process(`#parent.color`);
            await checkVFile(
              resp,
              '<a class="color-tag" style="--tag-color: #FF0033;" href="tags.parent.color.html">#parent.color</a>'
            );
          },
          {
            expect,
            preSetupHook: async ({ wsRoot, vaults }) => {
              note = await NoteTestUtilsV4.createNote({
                fname: "tags.parent",
                wsRoot,
                vault: vaults[0],
                props: { color: "#FF0033" },
              });
              await NoteTestUtilsV4.createNote({
                fname: "tags.parent.color",
                wsRoot,
                vault: vaults[0],
              });
            },
          }
        );
      });

      test("overrides color cascading from parent", async () => {
        let note: NoteProps;
        await runEngineTestV5(
          async ({ engine }) => {
            const proc = createProcForTest({
              engine,
              dest: DendronASTDest.HTML,
              vault: note.vault,
            });
            const resp = await proc.process(`#parent.color`);
            await checkVFile(
              resp,
              '<a class="color-tag" style="--tag-color: #00FF11;" href="tags.parent.color.html">#parent.color</a>'
            );
          },
          {
            expect,
            preSetupHook: async ({ wsRoot, vaults }) => {
              note = await NoteTestUtilsV4.createNote({
                fname: "tags.parent",
                wsRoot,
                vault: vaults[0],
                props: { color: "#FF0033" },
              });
              await NoteTestUtilsV4.createNote({
                fname: "tags.parent.color",
                wsRoot,
                vault: vaults[0],
                props: { color: "#00FF11" },
              });
            },
          }
        );
      });
    });

    const INSIDE_LINK = createProcTests({
      name: "inside a link",
      setupFunc: async ({ engine, vaults, extra }) => {
        const proc2 = createProcForTest({
          engine,
          dest: extra.dest,
          vault: vaults[0],
        });
        const resp = await proc2.process(
          "[#dendron](https://twitter.com/hashtag/dendron)"
        );
        return { resp };
      },
      verifyFuncDict: {
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(
            resp,
            '<a href="https://twitter.com/hashtag/dendron">#dendron</a>'
          );
          await checkNotInVFile(resp, `Private`);
        },
      },
      preSetupHook: ENGINE_HOOKS.setupBasic,
    });

    describe("WHEN disabled in config", () => {
      test("THEN hashtags don't get parsed or processed", async () => {
        await runEngineTestV5(
          async ({ engine, vaults }) => {
            const proc = MDUtilsV5.procRehypeFull(
              {
                engine,
                vault: vaults[0],
                config: engine.config,
                fname: "root",
              },
              {}
            );
            const out = await proc.process("#test");
            expect(checkVFile(out, "<p>#test</p>"));
            expect(checkNotInVFile(out, "<a", "tags.test"));
          },
          {
            expect,
            preSetupHook: async ({ wsRoot }) => {
              TestConfigUtils.withConfig(
                (config) => {
                  config.workspace!.enableHashTags = false;
                  return config;
                },
                { wsRoot }
              );
            },
          }
        );
      });
    });

    const ALL_TEST_CASES = [...SIMPLE, ...INSIDE_LINK];
    runAllTests({ name: "compile", testCases: ALL_TEST_CASES });
  });
});
