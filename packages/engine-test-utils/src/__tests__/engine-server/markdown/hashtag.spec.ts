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
  UnistNode,
} from "@dendronhq/unified";
import _ from "lodash";
import {
  ConfigService,
  ConfigUtils,
  NoteDictsUtils,
  NoteProps,
  ProcFlavor,
  URI,
} from "@dendronhq/common-all";
import { runEngineTestV5 } from "../../../engine";
import { ENGINE_HOOKS } from "../../../presets";
import {
  checkNotInVFile,
  checkVFile,
  createProcCompileTests,
  createProcForTest,
  createProcTests,
  ProcTests,
} from "./utils";
import { TestConfigUtils } from "../../..";
import { TestUnifiedUtils } from "../../../utils";
import { getOpts, runTestCases } from "./v5/utils";

const { getDescendantNode } = TestUnifiedUtils;

function proc() {
  return MDUtilsV5.procRemarkParseNoData({}, { dest: DendronASTDest.HTML });
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

    test("doesn't parse trailing punctuation except period (.)", () => {
      const resp1 = proc().parse(
        "Dolorem vero sed sapiente #dolores. Et quam id maxime et ratione."
      );
      expect(getDescendantNode(expect, resp1, 0, 1).type).toEqual(
        DendronASTTypes.HASHTAG
      );
      // @ts-ignore
      expect(getDescendantNode(expect, resp1, 0, 1).value).toEqual("#dolores.");

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
      const resp1 = proc().parse("彼女に「 #よろしく」言って下さい。");
      expect(getDescendantNode(expect, resp1, 0, 1).type).toEqual(
        DendronASTTypes.HASHTAG
      );
      // @ts-ignore
      expect(getDescendantNode(expect, resp1, 0, 1).value).toEqual("#よろしく");
    });

    test("doesn't parse when it's part of a sentence", () => {
      const resp1 = proc().parse("no#tag");
      expect(getDescendantNode(expect, resp1, 0, 0).type).not.toEqual(
        DendronASTTypes.HASHTAG
      );
      // @ts-ignore
      expect(getDescendantNode(expect, resp1, 0, 0).value).toEqual("no#tag");
    });
  });

  describe("rendering", () => {
    const hashtag = "#my-hash.tag0";

    describe("WHEN hashtag with prefix", () => {
      runTestCases(
        createProcCompileTests({
          name: "THEN hashtag has prefix",
          fname: "one",
          setup: async (opts) => {
            const { proc } = getOpts(opts);

            const noteCacheForRenderDict = NoteDictsUtils.createNoteDicts([
              await NoteTestUtilsV4.createNote({
                fname: "tags.my-hash.tag0",
                vault: opts.vaults[0],
                wsRoot: opts.wsRoot,
              }),
            ]);

            MDUtilsV5.setProcData(proc, { noteCacheForRenderDict });
            const resp = await proc.process(hashtag);
            return { resp, proc };
          },
          verify: {
            [DendronASTDest.HTML]: {
              [ProcFlavor.PUBLISHING]: async ({ extra }) => {
                const { resp } = extra;
                await checkVFile(resp, `href="/foo/notes/tags.my-hash.tag0"`);
              },
            },
          },
          preSetupHook: async (opts: any) => {
            const { wsRoot, vaults } = opts;
            const vault = vaults[0];
            await ENGINE_HOOKS.setupBasic(opts);
            await NoteTestUtilsV4.createNote({
              fname: "one",
              vault,
              wsRoot,
              body: hashtag,
            });
            await NoteTestUtilsV4.createNote({
              fname: "tags.my-hash.tag0",
              vault,
              wsRoot,
            });
            await TestConfigUtils.withConfig(
              (config) => {
                ConfigUtils.setPublishProp(config, "assetsPrefix", "/foo");
                return config;
              },
              { wsRoot }
            );
          },
        })
      );
    });

    const SIMPLE = createProcTests({
      name: "simple",
      setupFunc: async ({ engine, vaults, extra, wsRoot }) => {
        const config = (
          await ConfigService.instance().readConfig(URI.file(wsRoot))
        )._unsafeUnwrap();
        const proc2 = await createProcForTest({
          engine,
          dest: extra.dest,
          vault: vaults[0],
          config,
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
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(
            resp,
            '<a class="color-tag" style="--tag-color: #c95efb;" href="tags.my-hash.tag0">#my-hash.tag0</a>'
          );
        },
      },
      preSetupHook: ENGINE_HOOKS.setupBasic,
    });

    // TODO: Re-enable color test after color following ancestors in tags function is added back.
    describe.skip("colors", () => {
      test("with color", async () => {
        let note: NoteProps;
        await runEngineTestV5(
          async ({ engine, wsRoot }) => {
            const config = (
              await ConfigService.instance().readConfig(URI.file(wsRoot))
            )._unsafeUnwrap();
            const proc = await createProcForTest({
              engine,
              dest: DendronASTDest.HTML,
              vault: note.vault,
              config,
            });
            const resp = await proc.process(`#color`);
            await checkVFile(
              resp,
              '<a class="color-tag" style="--tag-color: #FF0033;" href="tags.color">#color</a>'
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

      test("when enableRandomlyGeneratedColors is false, only uses explicit colors", async () => {
        let note: NoteProps;
        await runEngineTestV5(
          async ({ engine, wsRoot }) => {
            const config = (
              await ConfigService.instance().readConfig(URI.file(wsRoot))
            )._unsafeUnwrap();
            const proc = await createProcForTest({
              engine,
              dest: DendronASTDest.HTML,
              vault: note.vault,
              config,
            });
            const resp = await proc.process(`#color #uncolored`);
            await checkVFile(
              resp,
              '<a class="color-tag" style="--tag-color: #FF0033;" href="tags.color">#color</a>',
              '<a href="tags.uncolored">#uncolored</a>'
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
              await TestConfigUtils.withConfig(
                (config) => {
                  ConfigUtils.setPublishProp(
                    config,
                    "enableRandomlyColoredTags",
                    false
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
          async ({ engine, wsRoot }) => {
            const config = (
              await ConfigService.instance().readConfig(URI.file(wsRoot))
            )._unsafeUnwrap();
            const proc = await createProcForTest({
              engine,
              dest: DendronASTDest.HTML,
              vault: note.vault,
              config,
            });
            const resp = await proc.process(`#parent.color`);
            await checkVFile(
              resp,
              '<a class="color-tag" style="--tag-color: #FF0033;" href="tags.parent.color">#parent.color</a>'
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
          async ({ engine, wsRoot }) => {
            const config = (
              await ConfigService.instance().readConfig(URI.file(wsRoot))
            )._unsafeUnwrap();
            const proc = await createProcForTest({
              engine,
              dest: DendronASTDest.HTML,
              vault: note.vault,
              config,
            });
            const resp = await proc.process(`#parent.color`);
            await checkVFile(
              resp,
              '<a class="color-tag" style="--tag-color: #FF0033;" href="tags.parent.color">#parent.color</a>'
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
          async ({ engine, wsRoot }) => {
            const config = (
              await ConfigService.instance().readConfig(URI.file(wsRoot))
            )._unsafeUnwrap();
            const proc = await createProcForTest({
              engine,
              dest: DendronASTDest.HTML,
              vault: note.vault,
              config,
            });
            const resp = await proc.process(`#parent.color`);
            await checkVFile(
              resp,
              '<a class="color-tag" style="--tag-color: #00FF11;" href="tags.parent.color">#parent.color</a>'
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
      setupFunc: async ({ engine, vaults, extra, wsRoot }) => {
        const config = (
          await ConfigService.instance().readConfig(URI.file(wsRoot))
        )._unsafeUnwrap();
        const proc2 = await createProcForTest({
          engine,
          dest: extra.dest,
          vault: vaults[0],
          config,
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
          async ({ engine, vaults, wsRoot }) => {
            const config = (
              await ConfigService.instance().readConfig(URI.file(wsRoot))
            )._unsafeUnwrap();
            const proc = MDUtilsV5.procRehypeFull(
              {
                noteToRender: (
                  await engine.findNotesMeta({
                    fname: "root",
                    vault: vaults[0],
                  })
                )[0]!,
                vault: vaults[0],
                config,
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
              await TestConfigUtils.withConfig(
                (config) => {
                  ConfigUtils.setWorkspaceProp(config, "enableHashTags", false);
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
