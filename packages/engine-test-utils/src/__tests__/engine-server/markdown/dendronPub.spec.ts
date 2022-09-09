import {
  ConfigUtils,
  DEngineClient,
  DVault,
  IntermediateDendronConfig,
  VaultUtils,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import { AssertUtils, NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { DConfig } from "@dendronhq/common-server";
import {
  DendronASTData,
  DendronASTDest,
  DendronPubOpts,
  MDUtilsV5,
  ProcFlavor,
  ProcMode,
  VFile,
} from "@dendronhq/unified";
import _ from "lodash";
import { TestConfigUtils } from "../../../config";
import { runEngineTestV5, testWithEngine } from "../../../engine";
import { ENGINE_HOOKS } from "../../../presets";
import { checkString, TestUnifiedUtils } from "../../../utils";
import { checkNotInVFile, checkVFile } from "./utils";

function proc(
  engine: DEngineClient,
  dendron: DendronASTData,
  opts?: DendronPubOpts,
  flavor?: ProcFlavor
) {
  return MDUtilsV5.procRehypeFull(
    {
      engine,
      ...dendron,
      wikiLinksOpts: {
        useId: false,
        ...opts?.wikiLinkOpts,
      },
      publishOpts: {
        wikiLinkOpts: {
          useId: false,
        },
        ...opts,
      },
    },
    flavor ? { flavor } : undefined
  );
}

const verifyPrivateLink = async (
  vfile: VFile,
  value: string,
  capitalize = true
) => {
  return TestUnifiedUtils.verifyPrivateLink({
    contents: vfile.contents as string,
    value: capitalize ? _.capitalize(value) : value,
  });
};

function verifyPublicLink(resp: any, match: string) {
  return checkString(resp.contents as string, `<a href="/notes/${match}">`);
}

function verifyPrivateNoteRef(resp: VFile) {
  // Example:
  // A private note ref is currently 2 empty <p> blocks in succession
  //
  // "<h1 id=\\"beta\\"><a aria-hidden=\\"true\\" class=\\"anchor-heading\\" href=\\"#beta\\"><svg aria-hidden=\\"true\\" viewBox=\\"0 0 16 16\\">
  // <use xlink:href=\\"#svg-link\\"></use></svg></a>Beta</h1>
  // <p></p><p></p><div class=\\"portal-container\\">
  // <div class=\\"portal-head\\">
  return checkString(
    resp.contents as string,
    `<p></p><p></p><div class="portal-container">`
  );
}

function verifyPublicNoteRef(resp: VFile, match: string) {
  // example: <a href=\\"/notes/beta\\" class=\\"portal-arrow\\">Go to text <span class=\\"right-arrow\\">→</span></a>
  // return checkString(resp.contents as string, `<a href="/notes/${match}">`);
  return checkString(
    resp.contents as string,
    `<a href="/notes/${match}" class="portal-arrow">Go to text <span class="right-arrow">→</span></a>`
  );
}

function genPublishConfigWithPublicPrivateHierarchies() {
  const config = ConfigUtils.genDefaultConfig();
  ConfigUtils.setPublishProp(config, "siteHierarchies", ["beta"]);
  return config;
}

function genPublishConfigWithAllPublicHierarchies() {
  const config = ConfigUtils.genDefaultConfig();
  ConfigUtils.setPublishProp(config, "siteHierarchies", ["alpha", "beta"]);
  return config;
}

function createProc({
  vaults,
  engine,
  linkText,
  fname,
  config,
}: WorkspaceOpts & {
  engine: DEngineClient;
  linkText: string;
  fname: string;
  config: IntermediateDendronConfig;
}) {
  const vault = vaults[0];

  const proc = MDUtilsV5.procRehypeFull(
    {
      engine,
      fname,
      vault,
      config,
    },
    { flavor: ProcFlavor.PUBLISHING }
  );
  return proc.process(linkText);
}

describe("GIVEN dendronPub", () => {
  const fnameAlpha = "alpha";
  const fnameBeta = "beta";

  describe("WHEN all notes are public", () => {
    const config = genPublishConfigWithAllPublicHierarchies();
    const fname = fnameBeta;

    describe("AND WHEN wikilink", () => {
      let resp: VFile;
      beforeAll(async () => {
        await runEngineTestV5(
          async (opts) => {
            resp = await createProc({
              ...opts,
              config,
              fname,
              linkText: `[[beta]] [[alpha]]`,
            });
          },
          {
            preSetupHook: ENGINE_HOOKS.setupLinks,
            expect,
          }
        );
      });
      test("THEN all links are rendered", async () => {
        await verifyPublicLink(resp, fnameBeta);
        await verifyPublicLink(resp, fnameAlpha);
      });
    });

    describe("WHEN publishing links to task notes", () => {
      const taskNote = "alpha.task";
      let resp: VFile;
      beforeAll(async () => {
        await runEngineTestV5(
          async (opts) => {
            resp = await createProc({
              ...opts,
              config,
              fname,
              linkText: `[[${taskNote}]]`,
            });
          },
          {
            preSetupHook: async (opts) => {
              await ENGINE_HOOKS.setupLinks(opts);
              const { vaults, wsRoot } = opts;
              await NoteTestUtilsV4.createNote({
                fname: taskNote,
                vault: vaults[0],
                wsRoot,
                custom: {
                  status: "x",
                  due: "2022-08-28",
                  owner: "turing",
                  priority: "high",
                },
              });
            },
            expect,
          }
        );
      });
      test("THEN all links are rendered", async () => {
        await checkVFile(
          resp,
          "x",
          "priority:high",
          "due:2022-08-28",
          "@turing"
        );
      });
    });
  });

  describe("WHEN publish and private hierarchies", () => {
    const fname = fnameBeta;
    const config = genPublishConfigWithPublicPrivateHierarchies();

    describe("AND WHEN noteRef", () => {
      describe("AND WHEN noteref of private note", () => {
        let resp: VFile;
        beforeAll(async () => {
          await runEngineTestV5(
            async (opts) => {
              resp = await createProc({
                ...opts,
                config,
                fname,
                linkText: `![[alpha]]`,
              });
            },
            {
              preSetupHook: ENGINE_HOOKS.setupLinks,
              expect,
            }
          );
        });
        test("THEN private note is not rendered", async () => {
          await verifyPrivateNoteRef(resp);
        });
      });
    });

    describe("AND WHEN wikilink", () => {
      let resp: VFile;
      beforeAll(async () => {
        await runEngineTestV5(
          async (opts) => {
            resp = await createProc({
              ...opts,
              config,
              fname,
              linkText: `[[beta]] [[alpha]]`,
            });
          },
          {
            preSetupHook: ENGINE_HOOKS.setupLinks,
            expect,
          }
        );
      });
      test("THEN public link is rendered", async () => {
        await verifyPublicLink(resp, fnameBeta);
      });
      test("THEN private link is hidden", async () => {
        await verifyPrivateLink(resp, fnameAlpha);
      });
    });

    describe("AND WHEN xvault link", () => {
      let resp: VFile;
      beforeAll(async () => {
        await runEngineTestV5(
          async (opts) => {
            const vaultName = VaultUtils.getName(opts.vaults[0]);
            resp = await createProc({
              ...opts,
              config,
              fname,
              linkText: `[[dendron://${vaultName}/beta]] [[dendron://${vaultName}/alpha]]`,
            });
          },
          {
            preSetupHook: ENGINE_HOOKS.setupLinks,
            expect,
          }
        );
      });
      test("THEN public link is rendered", async () => {
        await verifyPublicLink(resp, fnameBeta);
      });
      test("THEN private link is hidden", async () => {
        await verifyPrivateLink(resp, fnameAlpha);
      });
    });
  });
});

describe("GIVEN dendronPub (old tests - need to be migrated)", () => {
  describe("prefix", () => {
    testWithEngine("imagePrefix", async ({ engine, wsRoot, vaults }) => {
      const out = proc(
        engine,
        {
          fname: "foo",
          dest: DendronASTDest.HTML,
          vault: vaults[0],
          config: DConfig.readConfigSync(wsRoot),
        },
        {
          assetsPrefix: "bond/",
        }
      ).processSync(`![alt-text](image-url.jpg)`);
      await checkVFile(out, '<img src="/image-url.jpg" alt="alt-text">');
    });

    testWithEngine(
      "imagePrefix with forward slash",
      async ({ engine, wsRoot, vaults }) => {
        const out = proc(
          engine,
          {
            fname: "foo",
            dest: DendronASTDest.HTML,
            vault: vaults[0],
            config: DConfig.readConfigSync(wsRoot),
          },
          {
            assetsPrefix: "/bond/",
          }
        ).processSync(`![alt-text](/image-url.jpg)`);
        await checkVFile(out, '<img src="/image-url.jpg" alt="alt-text">');
      }
    );
  });

  testWithEngine("in IMPORT mode", async ({ engine, vaults, wsRoot }) => {
    const config = DConfig.readConfigSync(wsRoot);
    const proc = MDUtilsV5.procRemarkParse(
      { mode: ProcMode.IMPORT },
      { dest: DendronASTDest.HTML, engine, wsRoot, vault: vaults[0], config }
    );
    const out = await proc.process("Testing publishing in IMPORT mode");
    await checkVFile(out, "Testing publishing in IMPORT mode");
  });

  describe("frontmatter tags", () => {
    const runProcForHasFMTags = async (opts: {
      engine: DEngineClient;
      vaults: DVault[];
      flavor: ProcFlavor;
    }) => {
      const { engine, vaults, flavor } = opts;
      const out = await proc(
        engine,
        {
          fname: "has.fmtags",
          dest: DendronASTDest.HTML,
          vault: vaults[0],
          config: DConfig.readConfigSync(engine.wsRoot),
        },
        undefined,
        flavor
      ).process("has fm tags");
      return out;
    };

    const runProcForNoFMTags = async (opts: {
      engine: DEngineClient;
      vaults: DVault[];
      flavor: ProcFlavor;
    }) => {
      const { engine, vaults, flavor } = opts;
      const out = await proc(
        engine,
        {
          fname: "no.fmtags",
          dest: DendronASTDest.HTML,
          vault: vaults[0],
          config: DConfig.readConfigSync(engine.wsRoot),
        },
        undefined,
        flavor
      ).process("has no fm tags");
      return out;
    };

    describe("GIVEN enableFrontmatterTags: true", () => {
      _.map([ProcFlavor.PUBLISHING, ProcFlavor.PREVIEW], (flavor) => {
        test(`THEN rendered when available: single tag, ${flavor}`, async () => {
          await runEngineTestV5(
            async ({ engine, vaults }) => {
              const out = await runProcForHasFMTags({ engine, vaults, flavor });

              // `Tags` section and a link to `first` with no hashtag should be present
              await checkVFile(out, "Tags", "first");
              await checkNotInVFile(out, "#first");
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

        test(`THEN rendered when available: multiple tags, ${flavor}`, async () => {
          await runEngineTestV5(
            async ({ engine, vaults }) => {
              const out = await runProcForHasFMTags({ engine, vaults, flavor });

              // `Tags` section and links to `first` and `second`,
              // both without hashtags should be present
              await checkVFile(out, "Tags", "first", "second");
              await checkNotInVFile(out, "#first", "#second");
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

      _.map([ProcFlavor.PUBLISHING, ProcFlavor.PREVIEW], (flavor) => {
        test(`THEN not rendered when missing: ${flavor}`, async () => {
          await runEngineTestV5(
            async ({ engine, vaults }) => {
              const out = await runProcForNoFMTags({ engine, vaults, flavor });

              // `Tags` section should not be present
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
      });

      describe("WHEN enableHashesForFMTags: true", () => {
        _.map([ProcFlavor.PUBLISHING, ProcFlavor.PREVIEW], (flavor) => {
          test(`THEN rendered with a hashtag(#): ${flavor}`, async () => {
            await runEngineTestV5(
              async ({ engine, vaults }) => {
                const out = await runProcForHasFMTags({
                  engine,
                  vaults,
                  flavor,
                });

                // `Tags` section with links to `first` and `second`, both with hashtags
                // should be present
                await checkVFile(out, "Tags", "#first", "#second");
              },
              {
                preSetupHook: async ({ wsRoot, vaults }) => {
                  await NoteTestUtilsV4.createNote({
                    fname: "has.fmtags",
                    wsRoot,
                    vault: vaults[0],
                    props: { tags: ["first", "second"] },
                  });
                  TestConfigUtils.withConfig(
                    (config) => {
                      if (flavor === ProcFlavor.PUBLISHING) {
                        ConfigUtils.setPublishProp(
                          config,
                          "enableHashesForFMTags",
                          true
                        );
                      } else {
                        ConfigUtils.setPreviewProps(
                          config,
                          "enableHashesForFMTags",
                          true
                        );
                      }
                      return config;
                    },
                    { wsRoot }
                  );
                },
                expect,
              }
            );
          });
        });
      });
    });

    describe("GIVEN enableFrontmatterTags: false", () => {
      _.map([ProcFlavor.PUBLISHING, ProcFlavor.PREVIEW], (flavor) => {
        test(`THEN not rendered: ${flavor}`, async () => {
          await runEngineTestV5(
            async ({ engine, vaults }) => {
              const out = await runProcForHasFMTags({ engine, vaults, flavor });
              // `Tags` section should not be present
              await checkNotInVFile(out, "Tags");
            },
            {
              preSetupHook: async ({ wsRoot, vaults }) => {
                TestConfigUtils.withConfig(
                  (c) => {
                    if (flavor === ProcFlavor.PUBLISHING) {
                      ConfigUtils.setPublishProp(
                        c,
                        "enableFrontmatterTags",
                        false
                      );
                    } else {
                      ConfigUtils.setPreviewProps(
                        c,
                        "enableFrontmatterTags",
                        false
                      );
                    }
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
    });
  });

  describe("note reference", () => {
    test("basic", async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot, vaults }) => {
          const out = await proc(engine, {
            fname: "ref",
            dest: DendronASTDest.HTML,
            vault: vaults[0],
            config: DConfig.readConfigSync(wsRoot),
          }).process("![[foo]]");
          await checkVFile(out, 'a href="foo"');
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

    test("WHEN refs are right on the next line THEN render all", async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot, vaults }) => {
          const out = await proc(engine, {
            fname: "ref",
            dest: DendronASTDest.HTML,
            vault: vaults[0],
            config: DConfig.readConfigSync(wsRoot),
          }).process("![[foo1]]\n![[foo2]]\n![[foo3]]");
          await checkVFile(out, 'a href="foo1', 'a href="foo2', 'a href="foo3');
        },
        {
          preSetupHook: async ({ wsRoot, vaults }) => {
            await NoteTestUtilsV4.createNote({
              fname: "ref",
              wsRoot,
              vault: vaults[0],
            });
            await NoteTestUtilsV4.createNote({
              fname: "foo1",
              wsRoot,
              vault: vaults[0],
            });
            await NoteTestUtilsV4.createNote({
              fname: "foo2",
              wsRoot,
              vault: vaults[0],
            });
            await NoteTestUtilsV4.createNote({
              fname: "foo3",
              wsRoot,
              vault: vaults[0],
            });
          },
          expect,
        }
      );
    });

    test("WHEN refs are back to back THEN render all", async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot, vaults }) => {
          const out = await proc(engine, {
            fname: "ref",
            dest: DendronASTDest.HTML,
            vault: vaults[0],
            config: DConfig.readConfigSync(wsRoot),
          }).process("![[foo1]] ![[foo2]]");
          await checkVFile(out, 'a href="foo1', 'a href="foo2');
        },
        {
          preSetupHook: async ({ wsRoot, vaults }) => {
            await NoteTestUtilsV4.createNote({
              fname: "ref",
              wsRoot,
              vault: vaults[0],
            });
            await NoteTestUtilsV4.createNote({
              fname: "foo1",
              wsRoot,
              vault: vaults[0],
            });
            await NoteTestUtilsV4.createNote({
              fname: "foo2",
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
        async ({ engine, wsRoot, vaults }) => {
          const out = await proc(engine, {
            fname: "ref",
            dest: DendronASTDest.HTML,
            vault: vaults[0],
            config: DConfig.readConfigSync(wsRoot),
          }).process("![[bar]]");
          await checkVFile(out, "No note with name bar found");
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
        async ({ engine, wsRoot, vaults }) => {
          const out = await proc(engine, {
            fname: "ref",
            dest: DendronASTDest.HTML,
            vault: vaults[0],
            config: DConfig.readConfigSync(wsRoot),
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
        async ({ engine, wsRoot, vaults }) => {
          const out = await proc(engine, {
            fname: "ref",
            dest: DendronASTDest.HTML,
            vault: vaults[0],
            config: DConfig.readConfigSync(wsRoot),
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
        async ({ engine, wsRoot, vaults }) => {
          const out = await proc(engine, {
            fname: "ref",
            dest: DendronASTDest.HTML,
            vault: vaults[0],
            config: DConfig.readConfigSync(wsRoot),
          }).process("![[dendron://vault2/bar]]");
          await checkVFile(out, "No note with name bar found in vault vault2");
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
        async ({ engine, wsRoot, vaults }) => {
          const out = await proc(engine, {
            fname: "ref",
            dest: DendronASTDest.HTML,
            vault: vaults[0],
            config: DConfig.readConfigSync(wsRoot),
          }).process("![[bar.*]]");
          await checkVFile(out, 'a href="bar.one');
          await checkVFile(out, 'a href="bar.two');
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
        async ({ engine, wsRoot, vaults }) => {
          const out = await proc(engine, {
            fname: "ref",
            dest: DendronASTDest.HTML,
            vault: vaults[0],
            config: DConfig.readConfigSync(wsRoot),
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
        async ({ engine, wsRoot, vaults }) => {
          const config = DConfig.readConfigSync(wsRoot);
          const out = await proc(engine, {
            fname: "ref",
            dest: DendronASTDest.HTML,
            vault: vaults[0],
            config,
          }).process("![[dupe]]");
          const publishingConfig = ConfigUtils.getPublishingConfig(config);
          const dupNoteVaultPayload = publishingConfig.duplicateNoteBehavior
            ?.payload as string[];
          await checkVFile(out as any, `dupe in ${dupNoteVaultPayload[0]}`);
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
        async ({ engine, wsRoot, vaults }) => {
          const config = DConfig.readConfigSync(wsRoot);
          ConfigUtils.unsetPublishProp(config, "duplicateNoteBehavior");
          const out = await MDUtilsV5.procRehypeFull(
            {
              engine,
              fname: "ref",
              vault: vaults[0],
              config,
            },
            { flavor: ProcFlavor.PUBLISHING }
          ).process("![[dupe]]");
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

  describe("enablePrettyRefs", () => {
    testWithEngine(
      "config.publishing.enablePrettyRef: true",
      async ({ engine, vaults }) => {
        const config = ConfigUtils.genDefaultConfig();
        ConfigUtils.setPreviewProps(config, "enablePrettyRefs", false);
        ConfigUtils.setPublishProp(config, "siteHierarchies", ["foo"]);
        ConfigUtils.setPublishProp(config, "siteRootDir", "foo");
        ConfigUtils.setPublishProp(config, "enablePrettyRefs", true);
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
      "config.publishing.enablePrettyRef: false",
      async ({ engine, vaults }) => {
        const config = ConfigUtils.genDefaultConfig();
        ConfigUtils.setPreviewProps(config, "enablePrettyRefs", false);
        ConfigUtils.setPublishProp(config, "siteHierarchies", ["foo"]);
        ConfigUtils.setPublishProp(config, "siteRootDir", "foo");
        ConfigUtils.setPublishProp(config, "enablePrettyRefs", false);
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
      "config.enablePrettyRef: true",
      async ({ engine, vaults }) => {
        const config = ConfigUtils.genDefaultConfig();
        ConfigUtils.setPreviewProps(config, "enablePrettyRefs", true);
        ConfigUtils.setPublishProp(config, "siteHierarchies", ["foo"]);
        ConfigUtils.setPublishProp(config, "siteRootDir", "foo");
        ConfigUtils.setPublishProp(config, "enablePrettyRefs", false);
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
      "config.enablePrettyRef: false",
      async ({ engine, vaults }) => {
        const config = ConfigUtils.genDefaultConfig();
        ConfigUtils.setPreviewProps(config, "enablePrettyRefs", false);
        ConfigUtils.setPublishProp(config, "siteHierarchies", ["foo"]);
        ConfigUtils.setPublishProp(config, "siteRootDir", "foo");
        ConfigUtils.setPublishProp(config, "enablePrettyRefs", false);
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
      "enablePrettyRef defaults to true in both cases",
      async ({ engine, vaults }) => {
        const config = ConfigUtils.genDefaultConfig();
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
            match: [
              `<iframe src="/refs/bar---0" title="Reference to the note called Bar">Your browser does not support iframes.</iframe>`,
            ],
          })
        ).toBeTruthy();
      },
      { preSetupHook: ENGINE_HOOKS.setupBasic }
    );

    describe("WHEN config sets enablePrettyRefs true", () => {
      describe("AND note overrides to false", () => {
        testWithEngine(
          "THEN renders without pretty refs",
          async ({ engine, vaults }) => {
            const config = ConfigUtils.genDefaultConfig();
            ConfigUtils.setPreviewProps(config, "enablePrettyRefs", true);
            ConfigUtils.setPublishProp(config, "siteHierarchies", [
              "with-override",
            ]);
            ConfigUtils.setPublishProp(config, "siteRootDir", "with-override");
            ConfigUtils.setPublishProp(config, "enablePrettyRefs", true);
            const resp = await MDUtilsV5.procRehypeFull(
              {
                engine,
                fname: "with-override",
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
          {
            preSetupHook: async (opts) => {
              await ENGINE_HOOKS.setupBasic(opts);
              await NoteTestUtilsV4.createNote({
                fname: "with-override",
                vault: opts.vaults[0],
                wsRoot: opts.wsRoot,
                props: {
                  config: {
                    global: {
                      enablePrettyRefs: false,
                    },
                  },
                },
              });
            },
          }
        );
      });
    });

    describe("WHEN config sets enablePrettyRefs false", () => {
      describe("AND note overrides to true", () => {
        testWithEngine(
          "THEN renders with pretty refs",
          async ({ engine, vaults }) => {
            const config = ConfigUtils.genDefaultConfig();
            ConfigUtils.setPreviewProps(config, "enablePrettyRefs", false);
            ConfigUtils.setPublishProp(config, "siteHierarchies", [
              "with-override",
            ]);
            ConfigUtils.setPublishProp(config, "siteRootDir", "with-override");
            ConfigUtils.setPublishProp(config, "enablePrettyRefs", false);
            const resp = await MDUtilsV5.procRehypeFull(
              {
                engine,
                fname: "with-override",
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
          {
            preSetupHook: async (opts) => {
              await ENGINE_HOOKS.setupBasic(opts);
              await NoteTestUtilsV4.createNote({
                fname: "with-override",
                vault: opts.vaults[0],
                wsRoot: opts.wsRoot,
                props: {
                  config: {
                    global: {
                      enablePrettyRefs: true,
                    },
                  },
                },
              });
            },
          }
        );
      });
    });
  });
});
