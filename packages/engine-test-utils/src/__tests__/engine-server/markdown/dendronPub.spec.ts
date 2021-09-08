import { DEngineClient } from "@dendronhq/common-all";
import { AssertUtils, NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS } from "../../../presets";
import {
  DConfig,
  DendronASTData,
  DendronASTDest,
  DendronPubOpts,
  MDUtilsV4,
  MDUtilsV5,
  ProcFlavor,
  ProcMode,
} from "@dendronhq/engine-server";
import { runEngineTestV5, testWithEngine } from "../../../engine";
import { checkNotInVFile, checkVFile } from "./utils";
import { TestConfigUtils } from "../../../config";

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
  describe("prefix", () => {
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

  testWithEngine("in IMPORT mode", async ({ engine, vaults, wsRoot }) => {
    const proc = MDUtilsV5.procRemarkParse(
      { mode: ProcMode.IMPORT },
      { dest: DendronASTDest.HTML, engine, wsRoot, vault: vaults[0] }
    );
    const out = await proc.process("Testing publishing in IMPORT mode");
    await checkVFile(out, "Testing publishing in IMPORT mode");
  });

  describe("frontmatter tags", () => {
    describe("are rendered when available", () => {
      test("single tag", async () => {
        await runEngineTestV5(
          async ({ engine, vaults }) => {
            const out = await proc(engine, {
              fname: "has.fmtags",
              dest: DendronASTDest.HTML,
              vault: vaults[0],
              config: engine.config,
            }).process("has fm tags");
            await checkVFile(out, "Tags", "first");
          },
          {
            preSetupHook: async ({ wsRoot, vaults }) => {
              await NoteTestUtilsV4.createNote({
                fname: "has.fmtags",
                wsRoot,
                vault: vaults[0],
                props: { tags: "first" },
              });
            },
            expect,
          }
        );
      });

      test("multiple tags", async () => {
        await runEngineTestV5(
          async ({ engine, vaults }) => {
            const out = await proc(engine, {
              fname: "has.fmtags",
              dest: DendronASTDest.HTML,
              vault: vaults[0],
              config: engine.config,
            }).process("has fm tags");
            await checkVFile(out, "Tags", "first", "second");
          },
          {
            preSetupHook: async ({ wsRoot, vaults }) => {
              await NoteTestUtilsV4.createNote({
                fname: "has.fmtags",
                wsRoot,
                vault: vaults[0],
                props: { tags: ["first", "second"] },
              });
            },
            expect,
          }
        );
      });
    });

    test("are not rendered when missing", async () => {
      await runEngineTestV5(
        async ({ engine, vaults }) => {
          const out = await proc(engine, {
            fname: "no.fmtags",
            dest: DendronASTDest.HTML,
            vault: vaults[0],
            config: engine.config,
          }).process("has no fm tags");
          await checkNotInVFile(out, "Tags");
        },
        {
          preSetupHook: async ({ wsRoot, vaults }) => {
            await NoteTestUtilsV4.createNote({
              fname: "no.fmtags",
              wsRoot,
              vault: vaults[0],
            });
          },
          expect,
        }
      );
    });

    test("are not rendered when disabled", async () => {
      await runEngineTestV5(
        async ({ engine, vaults }) => {
          const out = await proc(engine, {
            fname: "has.fmtags",
            dest: DendronASTDest.HTML,
            vault: vaults[0],
            config: engine.config,
          }).process("has fm tags");
          await checkNotInVFile(out, "Tags");
        },
        {
          preSetupHook: async ({ wsRoot, vaults }) => {
            TestConfigUtils.withConfig(
              (c) => {
                c.site.showFrontMatterTags = false;
                return c;
              },
              { wsRoot }
            );
            await NoteTestUtilsV4.createNote({
              fname: "has.fmtags",
              wsRoot,
              vault: vaults[0],
              props: { tags: ["first", "second"] },
            });
          },
          expect,
        }
      );
    });
  });

  describe("note reference", () => {
    test("basic", async () => {
      await runEngineTestV5(
        async ({ engine, vaults }) => {
          const out = await proc(engine, {
            fname: "ref",
            dest: DendronASTDest.HTML,
            vault: vaults[0],
            config: engine.config,
          }).process("![[foo]]");
          await checkVFile(out, 'a href="foo.html');
        },
        {
          preSetupHook: async ({ wsRoot, vaults }) => {
            await NoteTestUtilsV4.createNote({
              fname: "ref",
              wsRoot,
              vault: vaults[0],
            });
            await NoteTestUtilsV4.createNote({
              fname: "foo",
              wsRoot,
              vault: vaults[0],
            });
          },
          expect,
        }
      );
    });

    test("nonexistent", async () => {
      await runEngineTestV5(
        async ({ engine, vaults }) => {
          const out = await proc(engine, {
            fname: "ref",
            dest: DendronASTDest.HTML,
            vault: vaults[0],
            config: engine.config,
          }).process("![[bar]]");
          await checkVFile(
            out,
            "Error rendering note reference. No note found with name bar"
          );
        },
        {
          preSetupHook: async ({ wsRoot, vaults }) => {
            await NoteTestUtilsV4.createNote({
              fname: "ref",
              wsRoot,
              vault: vaults[0],
            });
            await NoteTestUtilsV4.createNote({
              fname: "foo",
              wsRoot,
              vault: vaults[0],
            });
          },
          expect,
        }
      );
    });

    test("assume vault", async () => {
      await runEngineTestV5(
        async ({ engine, vaults }) => {
          const out = await proc(engine, {
            fname: "ref",
            dest: DendronASTDest.HTML,
            vault: vaults[0],
            config: engine.config,
          }).process("![[foo]]");
          await checkVFile(out, "foo in vault2");
        },
        {
          preSetupHook: async ({ wsRoot, vaults }) => {
            await NoteTestUtilsV4.createNote({
              fname: "ref",
              wsRoot,
              vault: vaults[0],
            });
            await NoteTestUtilsV4.createNote({
              fname: "foo",
              body: "foo in vault2",
              wsRoot,
              vault: vaults[1],
            });
          },
          expect,
        }
      );
    });

    test("ok: with vault prefix", async () => {
      await runEngineTestV5(
        async ({ engine, vaults }) => {
          const out = await proc(engine, {
            fname: "ref",
            dest: DendronASTDest.HTML,
            vault: vaults[0],
            config: engine.config,
          }).process("![[dendron://vault2/foo]]");
          await checkVFile(out, "foo in vault2");
          await checkNotInVFile(out, "foo in vault1");
        },
        {
          preSetupHook: async ({ wsRoot, vaults }) => {
            await NoteTestUtilsV4.createNote({
              fname: "ref",
              wsRoot,
              vault: vaults[0],
            });
            await NoteTestUtilsV4.createNote({
              fname: "foo",
              body: "foo in vault1",
              wsRoot,
              vault: vaults[0],
            });
            await NoteTestUtilsV4.createNote({
              fname: "foo",
              body: "foo in vault2",
              wsRoot,
              vault: vaults[1],
            });
          },
          expect,
        }
      );
    });

    test("fail: with vault prefix", async () => {
      await runEngineTestV5(
        async ({ engine, vaults }) => {
          const out = await proc(engine, {
            fname: "ref",
            dest: DendronASTDest.HTML,
            vault: vaults[0],
            config: engine.config,
          }).process("![[dendron://vault2/bar]]");
          await checkVFile(out, "Error rendering note reference for bar");
        },
        {
          preSetupHook: async ({ wsRoot, vaults }) => {
            await NoteTestUtilsV4.createNote({
              fname: "ref",
              wsRoot,
              vault: vaults[0],
            });
            await NoteTestUtilsV4.createNote({
              fname: "foo",
              body: "foo in vault1",
              wsRoot,
              vault: vaults[0],
            });
            await NoteTestUtilsV4.createNote({
              fname: "foo",
              body: "foo in vault2",
              wsRoot,
              vault: vaults[1],
            });
          },
          expect,
        }
      );
    });

    test("ok: wildcard", async () => {
      await runEngineTestV5(
        async ({ engine, vaults }) => {
          const out = await proc(engine, {
            fname: "ref",
            dest: DendronASTDest.HTML,
            vault: vaults[0],
            config: engine.config,
          }).process("![[bar.*]]");
          await checkVFile(out, 'a href="bar.one.html');
          await checkVFile(out, 'a href="bar.two.html');
        },
        {
          preSetupHook: async ({ wsRoot, vaults }) => {
            await NoteTestUtilsV4.createNote({
              fname: "ref",
              wsRoot,
              vault: vaults[0],
            });
            await NoteTestUtilsV4.createNote({
              fname: "bar.one",
              body: "bar one",
              wsRoot,
              vault: vaults[0],
            });
            await NoteTestUtilsV4.createNote({
              fname: "bar.two",
              body: "bar two",
              wsRoot,
              vault: vaults[0],
            });
          },
          expect,
        }
      );
    });

    test("fail: wildcard no match", async () => {
      await runEngineTestV5(
        async ({ engine, vaults }) => {
          const out = await proc(engine, {
            fname: "ref",
            dest: DendronASTDest.HTML,
            vault: vaults[0],
            config: engine.config,
          }).process("![[baz.*]]");
          await checkVFile(
            out,
            "Error rendering note reference. There are no matches for"
          );
        },
        {
          preSetupHook: async ({ wsRoot, vaults }) => {
            await NoteTestUtilsV4.createNote({
              fname: "ref",
              wsRoot,
              vault: vaults[0],
            });
            await NoteTestUtilsV4.createNote({
              fname: "bar.one",
              body: "bar one",
              wsRoot,
              vault: vaults[0],
            });
            await NoteTestUtilsV4.createNote({
              fname: "bar.two",
              body: "bar two",
              wsRoot,
              vault: vaults[0],
            });
          },
          expect,
        }
      );
    });

    test("ok: ambiguous but duplicateNoteBehavior set", async () => {
      await runEngineTestV5(
        async ({ engine, vaults }) => {
          const out = await proc(engine, {
            fname: "ref",
            dest: DendronASTDest.HTML,
            vault: vaults[0],
            config: engine.config,
          }).process("![[dupe]]");
          const dupNoteVaultPayload = engine.config.site.duplicateNoteBehavior
            ?.payload as string[];
          await checkVFile(out, `dupe in ${dupNoteVaultPayload[0]}`);
        },
        {
          preSetupHook: async ({ wsRoot, vaults }) => {
            await NoteTestUtilsV4.createNote({
              fname: "ref",
              wsRoot,
              vault: vaults[0],
            });
            await NoteTestUtilsV4.createNote({
              fname: "dupe",
              genRandomId: true,
              body: "dupe in vault1",
              wsRoot,
              vault: vaults[0],
            });
            await NoteTestUtilsV4.createNote({
              fname: "dupe",
              genRandomId: true,
              body: "dupe in vault2",
              wsRoot,
              vault: vaults[1],
            });
          },
          expect,
        }
      );
    });

    test("fail: ambiguous", async () => {
      await runEngineTestV5(
        async ({ engine, vaults }) => {
          delete engine.config.site["duplicateNoteBehavior"];
          const out = await proc(engine, {
            fname: "ref",
            dest: DendronASTDest.HTML,
            vault: vaults[0],
            config: engine.config,
          }).process("![[dupe]]");
          await checkVFile(
            out,
            "Error rendering note reference. There are multiple notes with the name"
          );
        },
        {
          preSetupHook: async ({ wsRoot, vaults }) => {
            await NoteTestUtilsV4.createNote({
              fname: "ref",
              wsRoot,
              vault: vaults[0],
            });
            await NoteTestUtilsV4.createNote({
              fname: "dupe",
              genRandomId: true,
              body: "dupe in vault1",
              wsRoot,
              vault: vaults[0],
            });
            await NoteTestUtilsV4.createNote({
              fname: "dupe",
              genRandomId: true,
              body: "dupe in vault2",
              wsRoot,
              vault: vaults[1],
            });
          },
          expect,
        }
      );
    });
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
          usePrettyRefs: true,
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

  describe("usePrettyRefs", () => {
    testWithEngine(
      "config.site.usePrettyRef: true",
      async ({ engine, vaults }) => {
        const config = DConfig.genDefaultConfig();
        config.usePrettyRefs = false;
        config.site = {
          siteHierarchies: ["foo"],
          siteRootDir: "foo",
          usePrettyRefs: true,
        };
        const resp = await MDUtilsV5.procRehypeFull(
          {
            engine,
            fname: "foo",
            vault: vaults[0],
            config,
          },
          { flavor: ProcFlavor.PUBLISHING }
        ).process(`![[bar]]`);
        expect(resp).toMatchSnapshot();
        expect(
          await AssertUtils.assertInString({
            body: resp.contents as string,
            match: ["portal-container"],
          })
        ).toBeTruthy();
      },
      { preSetupHook: ENGINE_HOOKS.setupBasic }
    );

    testWithEngine(
      "config.site.usePrettyRef: false",
      async ({ engine, vaults }) => {
        const config = DConfig.genDefaultConfig();
        config.usePrettyRefs = false;
        config.site = {
          siteHierarchies: ["foo"],
          siteRootDir: "foo",
          usePrettyRefs: false,
        };
        const resp = await MDUtilsV5.procRehypeFull(
          {
            engine,
            fname: "foo",
            vault: vaults[0],
            config,
          },
          { flavor: ProcFlavor.PUBLISHING }
        ).process(`![[bar]]`);
        expect(resp).toMatchSnapshot();
        expect(
          await AssertUtils.assertInString({
            body: resp.contents as string,
            nomatch: ["portal-container"],
          })
        ).toBeTruthy();
      },
      { preSetupHook: ENGINE_HOOKS.setupBasic }
    );

    testWithEngine(
      "config.usePrettyRef: true",
      async ({ engine, vaults }) => {
        const config = DConfig.genDefaultConfig();
        config.usePrettyRefs = true;
        config.site = {
          siteHierarchies: ["foo"],
          siteRootDir: "foo",
          usePrettyRefs: false,
        };
        const resp = await MDUtilsV5.procRehypeFull(
          {
            engine,
            fname: "foo",
            vault: vaults[0],
            config,
          },
          { flavor: ProcFlavor.PREVIEW }
        ).process(`![[bar]]`);
        expect(resp).toMatchSnapshot();
        expect(
          await AssertUtils.assertInString({
            body: resp.contents as string,
            match: ["portal-container"],
          })
        ).toBeTruthy();
      },
      { preSetupHook: ENGINE_HOOKS.setupBasic }
    );

    testWithEngine(
      "config.usePrettyRef: false",
      async ({ engine, vaults }) => {
        const config = DConfig.genDefaultConfig();
        config.usePrettyRefs = false;
        config.site = {
          siteHierarchies: ["foo"],
          siteRootDir: "foo",
          usePrettyRefs: false,
        };
        const resp = await MDUtilsV5.procRehypeFull(
          {
            engine,
            fname: "foo",
            vault: vaults[0],
            config,
          },
          { flavor: ProcFlavor.PREVIEW }
        ).process(`![[bar]]`);
        expect(resp).toMatchSnapshot();
        expect(
          await AssertUtils.assertInString({
            body: resp.contents as string,
            nomatch: ["portal-container"],
          })
        ).toBeTruthy();
      },
      { preSetupHook: ENGINE_HOOKS.setupBasic }
    );

    testWithEngine(
      "usePrettyRef defaults to true in both cases",
      async ({ engine, vaults }) => {
        const config = DConfig.genDefaultConfig();
        const previewResp = await MDUtilsV5.procRehypeFull(
          {
            engine,
            fname: "foo",
            vault: vaults[0],
            config,
          },
          { flavor: ProcFlavor.PREVIEW }
        ).process(`![[bar]]`);
        expect(previewResp).toMatchSnapshot();
        expect(
          await AssertUtils.assertInString({
            body: previewResp.contents as string,
            match: ["portal-container"],
          })
        ).toBeTruthy();

        const publishResp = await MDUtilsV5.procRehypeFull(
          {
            engine,
            fname: "foo",
            vault: vaults[0],
            config,
          },
          { flavor: ProcFlavor.PUBLISHING }
        ).process(`![[bar]]`);
        expect(publishResp).toMatchSnapshot();
        expect(
          await AssertUtils.assertInString({
            body: publishResp.contents as string,
            match: ["portal-container"],
          })
        ).toBeTruthy();
      },
      { preSetupHook: ENGINE_HOOKS.setupBasic }
    );
  });
});
