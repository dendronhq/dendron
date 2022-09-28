import {
  ConfigUtils,
  DendronASTDest,
  IntermediateDendronConfig,
  NoteDictsUtils,
  NoteProps,
  ProcFlavor,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import {
  AssertUtils,
  NoteTestUtilsV4,
  PreSetupHookFunction,
  TestPresetEntryV4,
} from "@dendronhq/common-test-utils";
import { DConfig } from "@dendronhq/common-server";
import { getParsingDependencyDicts, MDUtilsV5 } from "@dendronhq/unified";
import { TestConfigUtils } from "../../../config";
import { runEngineTestV5 } from "../../../engine";
import { ENGINE_HOOKS, ENGINE_SERVER } from "../../../presets";
import { checkNotInString, checkString } from "../../../utils";
import {
  checkNotInVFile,
  checkVFile,
  createProcCompileTests,
  createProcTests,
  generateVerifyFunction,
  processNote,
  processTextV2,
  ProcTests,
} from "./utils";
import { getOpts, runTestCases } from "./v5/utils";

function runAllTests(opts: {
  name: string;
  testCases: ProcTests[];
  only?: boolean;
}) {
  const { name, testCases } = opts;
  // Work around the husky check triggering accidentally
  const _describe = opts["only"] ? describe["only"] : describe;
  _describe(name, () => {
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

export const modifyNote = async (
  opts: WorkspaceOpts,
  fname: string,
  cb: (note: NoteProps) => NoteProps
) => {
  await NoteTestUtilsV4.modifyNoteByPath(
    { wsRoot: opts.wsRoot, vault: opts.vaults[0], fname },
    cb
  );
};

const TARGET_BODY: string = [
  "## head 1",
  "",
  "content 1",
  "### head 1.1",
  "",
  "content 1.1",
  "## head 2",
  "",
  "content 2",
].join("\n");

describe("noteRefV2", () => {
  const ANCHOR_WITH_SPACE_PRE_SETUP = async (opts: WorkspaceOpts) => {
    await ENGINE_HOOKS.setupBasic(opts);
    await modifyNote(opts, "foo", (note: NoteProps) => {
      const txt = [
        "---",
        "id: foo",
        "---",
        "## Header 1",
        "task1",
        "### Header 1.1",
        "task1.1",
        "## Header 2",
        "task2",
        "### Header 2.1",
        "task2.1",
        "## Header 3",
        "task3",
      ];
      note.body = txt.join("\n");
      return note;
    });
  };

  describe("WHEN parse header", () => {
    const preSetupHookForHeaders: PreSetupHookFunction = async (opts) => {
      await ANCHOR_WITH_SPACE_PRE_SETUP(opts);
    };
    describe("AND parse from start header", () => {
      runTestCases(
        createProcCompileTests({
          name: "THEN parse start header and sub headers",
          fname: "foo",
          setup: async (opts) => {
            const text = "# Foo Bar\n![[foo#header-1]]";
            const { proc } = getOpts(opts);

            const noteCacheForRenderDict = NoteDictsUtils.createNoteDicts([
              (await opts.engine.getNote("foo")).data!,
            ]);
            MDUtilsV5.setProcData(proc, { noteCacheForRenderDict });

            const resp = await proc.process(text);
            return { resp, proc };
          },
          verify: {
            [DendronASTDest.MD_REGULAR]: {
              [ProcFlavor.REGULAR]: async ({ extra }) => {
                const { resp } = extra;
                await checkVFile(resp, "task1", "task1.1");
                await checkNotInVFile(resp, "task2", "task3");
              },
            },
          },
          preSetupHook: preSetupHookForHeaders,
        })
      );
    });

    describe("AND parse from middle header", () => {
      runTestCases(
        createProcCompileTests({
          name: "THEN parse middle header and sub headers",
          fname: "foo",
          setup: async (opts) => {
            const text = "# Foo Bar\n![[foo#header-2]]";
            const { proc } = getOpts(opts);

            const noteCacheForRenderDict = NoteDictsUtils.createNoteDicts([
              (await opts.engine.getNote("foo")).data!,
            ]);
            MDUtilsV5.setProcData(proc, { noteCacheForRenderDict });

            const resp = await proc.process(text);
            return { resp, proc };
          },
          verify: {
            [DendronASTDest.MD_REGULAR]: {
              [ProcFlavor.REGULAR]: async ({ extra }) => {
                const { resp } = extra;
                await checkVFile(resp, "task2", "task2.1");
                await checkNotInVFile(resp, "task1", "task3");
              },
            },
          },
          preSetupHook: preSetupHookForHeaders,
        })
      );
    });

    describe("AND parse from end header", () => {
      runTestCases(
        createProcCompileTests({
          name: "THEN parse end header and sub headers",
          fname: "foo",
          setup: async (opts) => {
            const text = "# Foo Bar\n![[foo#header-3]]";
            const { proc } = getOpts(opts);

            const noteCacheForRenderDict = NoteDictsUtils.createNoteDicts([
              (await opts.engine.getNote("foo")).data!,
            ]);
            MDUtilsV5.setProcData(proc, { noteCacheForRenderDict });

            const resp = await proc.process(text);
            return { resp, proc };
          },
          verify: {
            [DendronASTDest.MD_REGULAR]: {
              [ProcFlavor.REGULAR]: async ({ extra }) => {
                const { resp } = extra;
                await checkVFile(resp, "task3");
                await checkNotInVFile(resp, "task1");
              },
            },
          },
          preSetupHook: preSetupHookForHeaders,
        })
      );
    });
  });

  describe("WHEN parse begin block", () => {
    const BEGIN_BLOCK_ANCHOR_SETUP = async (opts: WorkspaceOpts) => {
      await ENGINE_HOOKS.setupBasic(opts);
      await modifyNote(opts, "foo", (note: NoteProps) => {
        const txt = [
          "---",
          "id: foo",
          "---",
          "Some text at the beginning",
          "## Header 1",
        ];
        note.body = txt.join("\n");
        return note;
      });
    };
    const preSetupHookForHeaders: PreSetupHookFunction = async (opts) => {
      await BEGIN_BLOCK_ANCHOR_SETUP(opts);
    };

    describe("AND note has beginning section", () => {
      runTestCases(
        createProcCompileTests({
          name: "THEN parse beginning section",
          fname: "foo",
          setup: async (opts) => {
            const text = "![[foo#^begin]]";
            const { proc } = getOpts(opts);

            const noteCacheForRenderDict = NoteDictsUtils.createNoteDicts([
              (await opts.engine.getNote("foo")).data!,
            ]);
            MDUtilsV5.setProcData(proc, { noteCacheForRenderDict });

            const resp = await proc.process(text);
            return { resp, proc };
          },
          verify: {
            [DendronASTDest.MD_REGULAR]: {
              [ProcFlavor.REGULAR]: async ({ extra }) => {
                const { resp } = extra;
                await checkVFile(resp, "Some text at the beginning");
                await checkNotInVFile(resp, "Header 1");
              },
            },
          },
          preSetupHook: preSetupHookForHeaders,
        })
      );
    });

    describe("AND note starts with a header", () => {
      runTestCases(
        createProcCompileTests({
          name: "THEN parse beginning section",
          fname: "foo",
          setup: async (opts) => {
            const text = "![[foo#^begin]]";
            const { proc } = getOpts(opts);
            const resp = await proc.process(text);
            return { resp, proc };
          },
          verify: {
            [DendronASTDest.MD_REGULAR]: {
              [ProcFlavor.REGULAR]: async ({ extra }) => {
                const { resp } = extra;
                await checkNotInVFile(resp, "Some text at the beginning");
              },
            },
          },
          preSetupHook: async (opts) => {
            await ENGINE_HOOKS.setupBasic(opts);
            await modifyNote(opts, "foo", (note: NoteProps) => {
              const txt = [
                "---",
                "id: foo",
                "---",
                "# Foo",
                "Some text at the beginning",
              ];
              note.body = txt.join("\n");
              return note;
            });
          },
        })
      );
    });

    describe("AND note has beginning section but no headers", () => {
      runTestCases(
        createProcCompileTests({
          name: "THEN parse beginning section",
          fname: "foo",
          setup: async (opts) => {
            const text = "![[foo#^begin]]";
            const { proc } = getOpts(opts);

            const noteCacheForRenderDict = NoteDictsUtils.createNoteDicts([
              (await opts.engine.getNote("foo")).data!,
            ]);
            MDUtilsV5.setProcData(proc, { noteCacheForRenderDict });

            const resp = await proc.process(text);
            return { resp, proc };
          },
          verify: {
            [DendronASTDest.MD_REGULAR]: {
              [ProcFlavor.REGULAR]: async ({ extra }) => {
                const { resp } = extra;
                await checkVFile(resp, "Some text at the beginning");
              },
            },
          },
          preSetupHook: async (opts) => {
            await ENGINE_HOOKS.setupBasic(opts);
            await modifyNote(opts, "foo", (note: NoteProps) => {
              const txt = [
                "---",
                "id: foo",
                "---",
                "Some text at the beginning",
              ];
              note.body = txt.join("\n");
              return note;
            });
          },
        })
      );
    });
  });

  describe("WHEN parse end block", () => {
    const preSetupHookForHeaders: PreSetupHookFunction = async (opts) => {
      await ENGINE_HOOKS.setupBasic(opts);
      await modifyNote(opts, "foo", (note: NoteProps) => {
        const txt = [
          "---",
          "id: foo",
          "---",
          "begin section",
          "## Header 1",
          "body 1.1",
          "## Header 2",
          "body 2.2",
          "end section",
        ];
        note.body = txt.join("\n");
        return note;
      });
    };

    describe("AND WHEN try parse #^end anchor as start anchor", () => {
      runTestCases(
        createProcCompileTests({
          parsingDependenciesByFname: ["foo"],
          name: "THEN show error",
          fname: "foo",
          setup: async (opts) => {
            const text = "![[foo#^end]]";
            const { proc } = getOpts(opts);
            const resp = await proc.process(text);
            return { resp, proc };
          },
          verify: {
            [DendronASTDest.MD_REGULAR]: {
              [ProcFlavor.REGULAR]: async ({ extra }) => {
                const { resp } = extra;
                await checkVFile(
                  resp,
                  "the '^end' anchor cannot be used as the starting anchor"
                );
              },
            },
          },
          preSetupHook: preSetupHookForHeaders,
        })
      );
    });

    describe("AND note has beginning section", () => {
      runTestCases(
        createProcCompileTests({
          name: "THEN parse beginning section",
          fname: "foo",
          setup: async (opts) => {
            const text = "![[foo#header-1:#^end]]";
            const { proc } = getOpts(opts);
            const resp = await proc.process(text);
            return { resp, proc };
          },
          verify: {
            [DendronASTDest.MD_REGULAR]: {
              [ProcFlavor.REGULAR]: async ({ extra }) => {
                const { resp } = extra;
                await checkVFile(resp, "end section");
                await checkNotInVFile(resp, "begin section");
              },
            },
          },
          preSetupHook: preSetupHookForHeaders,
          parsingDependenciesByFname: ["foo"],
        })
      );
    });

    describe("AND note ends on a header", () => {
      runTestCases(
        createProcCompileTests({
          name: "THEN parse beginning section",
          fname: "foo",
          setup: async (opts) => {
            const text = "![[foo#header-1:#^end]]";
            const { proc } = getOpts(opts);
            const resp = await proc.process(text);
            return { resp, proc };
          },
          verify: {
            [DendronASTDest.MD_REGULAR]: {
              [ProcFlavor.REGULAR]: async ({ extra }) => {
                const { resp } = extra;
                await checkVFile(resp, "end section", "## Header 3");
              },
            },
          },
          preSetupHook: async (opts) => {
            await ENGINE_HOOKS.setupBasic(opts);
            await modifyNote(opts, "foo", (note: NoteProps) => {
              const txt = [
                "---",
                "id: foo",
                "---",
                "begin section",
                "## Header 1",
                "body 1.1",
                "## Header 2",
                "body 2.2",
                "end section",
                "## Header 3",
              ];
              note.body = txt.join("\n");
              return note;
            });
          },
          parsingDependenciesByFname: ["foo"],
        })
      );
    });
  });

  describe("common cases", () => {
    const linkWithNoExtension = "![[foo]]";

    const REGULAR_CASE = createProcTests({
      name: "regular",
      setupFunc: async ({ engine, wsRoot, vaults, extra }) => {
        const config = DConfig.readConfigSync(wsRoot);
        const noteToRender = (
          await engine.findNotes({ fname: "foo", vault: vaults[0] })
        )[0];
        const noteCacheForRenderDict = await getParsingDependencyDicts(
          noteToRender,
          engine,
          config,
          vaults
        );
        NoteDictsUtils.add(noteToRender, noteCacheForRenderDict);
        const proc2 = MDUtilsV5.procRemarkFull({
          noteToRender,
          noteCacheForRenderDict,
          fname: "foo",
          wikiLinksOpts: { useId: true },
          dest: extra.dest,
          vault: vaults[0],
          config,
        });
        const resp = await proc2.process(linkWithNoExtension);
        return { resp };
      },
      verifyFuncDict: {
        [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
          const { resp } = extra;
          expect(resp).toMatchSnapshot();
          expect(
            await AssertUtils.assertInString({
              body: resp.contents,
              match: [linkWithNoExtension],
            })
          ).toBeTruthy();
        },
        [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
          const { resp } = extra;
          expect(resp).toMatchSnapshot();
          return [
            {
              actual: await AssertUtils.assertInString({
                body: resp.toString(),
                match: ["foo body"],
              }),
              expected: true,
            },
          ];
        },
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          expect(resp).toMatchSnapshot();
          await checkVFile(
            resp,
            `<a href="foo" class="portal-arrow">Go to text <span class="right-arrow">`
          );
          return [];
        },
      },
      preSetupHook: ENGINE_HOOKS.setupBasic,
    });

    const WITH_ANCHOR_PRE_SETUP = async (opts: WorkspaceOpts) => {
      await ENGINE_HOOKS.setupBasic(opts);
      await modifyNote(opts, "foo", (note: NoteProps) => {
        const txt = [
          "---",
          "id: foo",
          "title: foo",
          "---",
          `# Tasks`,
          "## Header1",
          "task1",
          "## Header2",
          "task2",
        ];
        note.body = txt.join("\n");
        return note;
      });
    };

    const WITH_ANCHOR = createProcTests({
      name: "WITH_ANCHOR",
      setupFunc: async (opts) => {
        const text = "# Foo Bar\n![[foo#header2]]";
        return processTextV2({
          dest: opts.extra.dest,
          engine: opts.engine,
          text,
          fname: "foo",
          vault: opts.vaults[0],
          parsingDependenciesByFname: ["foo"],
        });
      },
      preSetupHook: WITH_ANCHOR_PRE_SETUP,
      verifyFuncDict: {
        [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "task2");
          await checkNotInVFile(resp, "task1");
        },
        [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
          const { resp } = extra;
          expect(
            await AssertUtils.assertInString({
              body: resp.toString(),
              match: ["![[foo#header2]]"],
            })
          ).toBeTruthy();
        },
        ...generateVerifyFunction({
          target: DendronASTDest.MD_REGULAR,
          exclude: [DendronASTDest.MD_DENDRON],
        }),
      },
    });

    const WITH_FM_TITLE = createProcTests({
      name: "WITH_FM_TITLE",
      setupFunc: async (opts) => {
        const { engine, wsRoot, vaults } = opts;
        const configOverride: IntermediateDendronConfig = {
          ...DConfig.readConfigSync(wsRoot),
          useFMTitle: true,
        };
        return processTextV2({
          text: "# Foo Bar\n![[foo#header2]]",
          dest: opts.extra.dest,
          engine,
          configOverride,
          vault: vaults[0],
          fname: "foo",
        });
      },
      preSetupHook: WITH_ANCHOR_PRE_SETUP,
      verifyFuncDict: {},
    });

    const WITH_NOTE_LINK_TITLE = createProcTests({
      name: "WITH_NOTE_LINK_TITLE",
      setupFunc: async (opts) => {
        const { engine, wsRoot, vaults } = opts;
        const configOverride: IntermediateDendronConfig = {
          ...DConfig.readConfigSync(wsRoot),
          useNoteTitleForLink: true,
        };
        return processTextV2({
          text: "# Foo Bar\n![[foo.ch1#header2]]",
          dest: opts.extra.dest,
          engine,
          configOverride,
          vault: vaults[0],
          fname: "foo",
        });
      },
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
        await modifyNote(opts, "foo.ch1", (note: NoteProps) => {
          const txt = [`# Tasks`, "## Header1", "task1", "## Header2", "task2"];
          note.body = txt.join("\n");
          return note;
        });
      },
      verifyFuncDict: {
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, `<span class="portal-text-title">Ch1</span>`);
        },
      },
    });

    const WITH_ANCHOR_TO_SAME_FILE = createProcTests({
      name: "WITH_ANCHOR_TO_SAME_FILE",
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
        await modifyNote(opts, "foo", (note: NoteProps) => {
          const txt = [
            "---",
            "id: foo",
            "---",
            "![[#header-2]]",
            "",
            "## Header 1",
            "task1",
            "## HeadeR 2",
            "task2",
          ];
          note.body = txt.join("\n");
          return note;
        });
      },
      setupFunc: async (opts) => {
        const { engine, vaults } = opts;
        return processNote({
          dest: opts.extra.dest,
          engine,
          vault: vaults[0],
          fname: "foo",
        });
      },
      verifyFuncDict: {
        [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
          const { resp } = extra;
          expect(
            await AssertUtils.assertTimesInString({
              body: resp.toString(),
              match: [
                [2, "task2"],
                [1, "task1"],
              ],
            })
          ).toBeTruthy();
        },
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          expect(
            await AssertUtils.assertTimesInString({
              body: resp.toString(),
              match: [
                [2, "task2"],
                [1, "task1"],
              ],
            })
          ).toBeTruthy();
        },
      },
    });

    const WITH_START_ANCHOR_INVALID = createProcTests({
      name: "WITH_START_ANCHOR_INVALID",
      setupFunc: async (opts) => {
        const { engine, vaults } = opts;
        return processTextV2({
          text: "# Foo Bar\n![[foo#badheader]]",
          dest: opts.extra.dest,
          engine,
          vault: vaults[0],
          fname: "foo",
          parsingDependenciesByFname: ["foo"],
        });
      },
      preSetupHook: WITH_ANCHOR_PRE_SETUP,
      verifyFuncDict: {
        [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
          const { resp } = extra;
          expect(
            await AssertUtils.assertInString({
              body: resp.toString(),
              match: ["badheader not found"],
            })
          ).toBeTruthy();
        },
        [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
          const { resp } = extra;
          expect(
            await AssertUtils.assertInString({
              body: resp.toString(),
              match: ["![[foo#badheader]]"],
            })
          ).toBeTruthy();
        },
        ...generateVerifyFunction({
          target: DendronASTDest.MD_REGULAR,
          exclude: [DendronASTDest.MD_DENDRON],
        }),
      },
    });

    const WITH_END_ANCHOR_INVALID = createProcTests({
      name: "WITH_END_ANCHOR_INVALID",
      setupFunc: async (opts) => {
        const { engine, vaults } = opts;
        return processTextV2({
          text: "# Foo Bar\n![[foo#header1:#badheader]]",
          dest: opts.extra.dest,
          engine,
          vault: vaults[0],
          fname: "foo",
          parsingDependenciesByFname: ["foo"],
        });
      },
      preSetupHook: WITH_ANCHOR_PRE_SETUP,
      verifyFuncDict: {
        [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
          const { resp } = extra;
          expect(
            await AssertUtils.assertInString({
              body: resp.toString(),
              match: ["badheader not found"],
            })
          ).toBeTruthy();
        },
        [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
          const { resp } = extra;
          expect(
            await AssertUtils.assertInString({
              body: resp.toString(),
              match: ["![[foo#header1:#badheader]]"],
            })
          ).toBeTruthy();
        },
        ...generateVerifyFunction({
          target: DendronASTDest.MD_REGULAR,
          exclude: [DendronASTDest.MD_DENDRON],
        }),
      },
    });

    const WITH_START_ANCHOR_OFFSET = createProcTests({
      name: "WITH_START_ANCHOR_OFFSET",
      setupFunc: async (opts) => {
        const { engine, vaults } = opts;
        return processTextV2({
          text: "# Foo Bar\n![[foo#header2,1]]",
          dest: opts.extra.dest,
          engine,
          vault: vaults[0],
          fname: "foo",
          parsingDependenciesByFname: ["foo"],
        });
      },
      preSetupHook: WITH_ANCHOR_PRE_SETUP,
      verifyFuncDict: {
        [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
          const { resp } = extra;
          expect(
            await AssertUtils.assertInString({
              body: resp.toString(),
              match: ["[[foo#header2,1]]"],
            })
          ).toBeTruthy();
        },
        [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
          const { resp } = extra;
          expect(
            await AssertUtils.assertInString({
              body: resp.toString(),
              match: ["task2"],
              nomatch: ["Header2", "task1"],
            })
          ).toBeTruthy();
        },
        ...generateVerifyFunction({
          target: DendronASTDest.MD_REGULAR,
          exclude: [DendronASTDest.MD_DENDRON],
        }),
      },
    });

    const WITH_START_AND_END_ANCHOR = createProcTests({
      name: "WITH_START_AND_END_ANCHOR",
      setupFunc: async (opts) => {
        const { engine, vaults, wsRoot } = opts;
        const target = await NoteTestUtilsV4.createNote({
          fname: "target",
          vault: vaults[0],
          wsRoot,
          body: TARGET_BODY,
        });
        return processTextV2({
          text: "# header\n![[target#head-1:#head-2]]",
          dest: opts.extra.dest,
          engine,
          vault: vaults[0],
          fname: "foo",
          parsingDependenciesByNoteProps: [target],
        });
      },
      preSetupHook: async ({ wsRoot, vaults }) => {
        const vault = vaults[0];
        await NoteTestUtilsV4.createNote({
          fname: "target",
          vault,
          wsRoot,
          body: TARGET_BODY,
        });
        await NoteTestUtilsV4.createNote({
          fname: "foo",
          vault,
          wsRoot,
        });
      },
      verifyFuncDict: {
        [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
          const { resp } = extra;
          expect(
            await AssertUtils.assertInString({
              body: resp.toString(),
              match: ["# header", "![[target#head-1:#head-2]]"],
            })
          ).toBeTruthy();
        },
        [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
          const { resp } = extra;
          expect(
            await AssertUtils.assertInString({
              body: resp.toString(),
              match: ["content 1.1"],
              nomatch: ["head 2"],
            })
          ).toBeTruthy();
        },
        ...generateVerifyFunction({
          target: DendronASTDest.MD_REGULAR,
          exclude: [DendronASTDest.MD_DENDRON],
        }),
      },
    });

    const WITH_START_AND_END_WILDCARD_ANCHOR = createProcTests({
      name: "WITH_START_AND_END_WILDCARD_ANCHOR",
      setupFunc: async (opts) => {
        const { engine, vaults, wsRoot } = opts;
        const target = await NoteTestUtilsV4.createNote({
          fname: "target",
          vault: vaults[0],
          wsRoot,
          body: TARGET_BODY,
        });
        return processTextV2({
          text: "# header\n![[target#head-1:#*]]",
          dest: opts.extra.dest,
          engine,
          vault: vaults[0],
          fname: "foo",
          parsingDependenciesByNoteProps: [target],
        });
      },
      preSetupHook: async ({ wsRoot, vaults }) => {
        const vault = vaults[0];
        await NoteTestUtilsV4.createNote({
          fname: "target",
          vault,
          wsRoot,
          body: TARGET_BODY,
        });
        await NoteTestUtilsV4.createNote({
          fname: "foo",
          vault,
          wsRoot,
        });
      },
      verifyFuncDict: {
        [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
          const { resp } = extra;
          expect(
            await AssertUtils.assertInString({
              body: resp.toString(),
              match: ["# header", "![[target#head-1:#*]]"],
            })
          ).toBeTruthy();
        },
        [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
          const { resp } = extra;
          expect(
            await AssertUtils.assertInString({
              body: resp.toString(),
              match: ["content 1"],
              nomatch: ["head 1.1"],
            })
          ).toBeTruthy();
        },
        ...generateVerifyFunction({
          target: DendronASTDest.MD_REGULAR,
          exclude: [DendronASTDest.MD_DENDRON],
        }),
      },
    });

    const RECURSIVE_TEST_CASES = createProcTests({
      name: "recursive",
      setupFunc: async ({ wsRoot, extra, vaults, engine }) => {
        const config = DConfig.readConfigSync(wsRoot);
        const noteToRender = (
          await engine.findNotes({ fname: "root", vault: vaults[0] })
        )[0];
        const noteCacheForRenderDict = await getParsingDependencyDicts(
          noteToRender,
          engine,
          config,
          vaults
        );
        NoteDictsUtils.add(
          (await engine.getNote("foo.one-id")).data!,
          noteCacheForRenderDict
        );
        NoteDictsUtils.add(
          (await engine.getNote("foo.two")).data!,
          noteCacheForRenderDict
        );
        const resp = await MDUtilsV5.procRemarkFull({
          noteToRender,
          noteCacheForRenderDict,
          dest: extra.dest,
          vault: vaults[0],
          fname: "root",
          config,
        }).process(linkWithNoExtension);
        return { resp };
      },
      verifyFuncDict: {
        [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
          const { resp } = extra;
          expect(resp).toMatchSnapshot();
          expect(
            await AssertUtils.assertInString({
              body: resp.contents,
              match: [linkWithNoExtension],
            })
          ).toBeTruthy();
        },
        [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
          const { resp } = extra;
          expect(resp).toMatchSnapshot();
          return [
            {
              actual: await AssertUtils.assertInString({
                body: resp.toString(),
                match: ["# Foo", "# Foo.One", "# Foo.Two", "Regular wikilink"],
                nomatch: ["portal-container"],
              }),
              expected: true,
            },
          ];
        },
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          expect(resp).toMatchSnapshot();
          return [
            {
              actual: await AssertUtils.assertInString({
                body: resp.toString(),
                match: [
                  "# Foo",
                  "# Foo.One",
                  "# Foo.Two",
                  "portal",
                  "Regular wikilink",
                ],
              }),
              expected: true,
            },
          ];
        },
      },
      preSetupHook: ENGINE_HOOKS.setupNoteRefRecursive,
    });

    const WILDCARD_CASE = createProcTests({
      name: "wildcard",
      setupFunc: async ({ engine, wsRoot, extra, vaults }) => {
        const note = (await engine.getNote("id.journal")).data!;
        const config = DConfig.readConfigSync(wsRoot);
        const noteToRender = (
          await engine.findNotes({ fname: "root", vault: vaults[0] })
        )[0];
        const noteCacheForRenderDict = await getParsingDependencyDicts(
          noteToRender,
          engine,
          config,
          vaults
        );
        NoteDictsUtils.add(noteToRender, noteCacheForRenderDict);
        NoteDictsUtils.add(
          (await engine.findNotes({ fname: "journal", vault: vaults[0] }))[0],
          noteCacheForRenderDict
        );
        NoteDictsUtils.add(
          (
            await engine.findNotes({ fname: "journal.2020", vault: vaults[0] })
          )[0],
          noteCacheForRenderDict
        );
        NoteDictsUtils.add(
          (
            await engine.findNotes({
              fname: "journal.2020.07",
              vault: vaults[0],
            })
          )[0],
          noteCacheForRenderDict
        );
        NoteDictsUtils.add(
          (
            await engine.findNotes({
              fname: "journal.2020.07.01",
              vault: vaults[0],
            })
          )[0],
          noteCacheForRenderDict
        );
        NoteDictsUtils.add(
          (
            await engine.findNotes({
              fname: "journal.2020.08",
              vault: vaults[0],
            })
          )[0],
          noteCacheForRenderDict
        );
        NoteDictsUtils.add(
          (
            await engine.findNotes({
              fname: "journal.2020.08.01",
              vault: vaults[0],
            })
          )[0],
          noteCacheForRenderDict
        );
        NoteDictsUtils.add(
          (
            await engine.findNotes({
              fname: "journal.2020.08.02",
              vault: vaults[0],
            })
          )[0],
          noteCacheForRenderDict
        );
        NoteDictsUtils.add(
          (
            await engine.findNotes({
              fname: "journal.2020.08.03",
              vault: vaults[0],
            })
          )[0],
          noteCacheForRenderDict
        );
        const resp = await MDUtilsV5.procRemarkFull({
          noteToRender,
          noteCacheForRenderDict,
          config,
          dest: extra.dest,
          vault: vaults[0],
          fname: "root",
          // Otherwise links use random note ids which are unstable in snaps
          wikiLinksOpts: {
            useId: false,
          },
          publishOpts: {
            wikiLinkOpts: {
              useId: false,
            },
          },
          wsRoot,
        }).process(note.body);
        return { resp };
      },
      verifyFuncDict: {
        [DendronASTDest.MD_DENDRON]: async ({ extra, engine }) => {
          const note = (await engine.getNote("id.journal")).data!;
          const { resp } = extra;
          expect(resp).toMatchSnapshot();
          expect(
            await AssertUtils.assertInString({
              body: resp.contents,
              match: [note.body],
            })
          ).toBeTruthy();
        },
        [DendronASTDest.MD_REGULAR]: async ({ extra, engine }) => {
          const { resp } = extra;
          expect(resp).toMatchSnapshot();
          // @ts-ignore
          return ENGINE_SERVER.NOTE_REF.WILDCARD_LINK_V4.genTestResults!({
            engine,
            extra: { body: resp.toString() },
          });
        },
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          expect(resp).toMatchSnapshot();
        },
      },
      preSetupHook: ENGINE_SERVER.NOTE_REF.WILDCARD_LINK_V4.preSetupHook,
    });
    const XVAULT_CASE = createProcTests({
      name: "XVAULT_CASE",
      setupFunc: async ({ engine, wsRoot, extra, vaults }) => {
        const note = (await engine.getNote("one")).data!;
        const config = DConfig.readConfigSync(wsRoot);
        const noteCacheForRenderDict = await getParsingDependencyDicts(
          note,
          engine,
          config,
          vaults
        );
        const resp = await MDUtilsV5.procRemarkFull({
          noteToRender: note,
          noteCacheForRenderDict,
          dest: extra.dest,
          vault: vaults[0],
          fname: "root",
          config,
        }).process(note.body);
        return { resp };
      },
      verifyFuncDict: {
        [DendronASTDest.MD_DENDRON]: async ({ extra, engine }) => {
          const note = (await engine.getNote("one")).data!;
          const { resp } = extra;
          expect(resp).toMatchSnapshot();
          expect(
            await AssertUtils.assertInString({
              body: resp.contents,
              match: [note.body],
            })
          ).toBeTruthy();
        },
        [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
          // should have contents
          const { resp } = extra;
          expect(resp).toMatchSnapshot();
          expect(
            await AssertUtils.assertInString({
              body: resp.contents,
              match: ["two content"],
            })
          ).toBeTruthy();
        },
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          expect(resp).toMatchSnapshot();
          expect(
            await AssertUtils.assertInString({
              body: resp.contents,
              match: ["two content"],
            })
          ).toBeTruthy();
        },
      },
      preSetupHook: async ({ wsRoot, vaults }) => {
        const vault1 = vaults[0];
        const vault2 = vaults[1];
        await NoteTestUtilsV4.createNote({
          fname: "one",
          vault: vault1,
          wsRoot,
          body: "![[dendron://vault2/two]]",
        });
        await NoteTestUtilsV4.createNote({
          fname: "two",
          vault: vault2,
          wsRoot,
          body: "two content",
        });
      },
    });

    const WITH_PUBLISHING = createProcTests({
      name: "WITH_PUBLISHING",
      setupFunc: async ({ engine, wsRoot, extra, vaults }) => {
        const note = (await engine.getNote("foo")).data!;
        const config = DConfig.readConfigSync(wsRoot);
        const noteToRender = (
          await engine.findNotes({ fname: "root", vault: vaults[0] })
        )[0];
        const noteCacheForRenderDict = await getParsingDependencyDicts(
          noteToRender,
          engine,
          config,
          vaults
        );
        const resp = await MDUtilsV5.procRemarkFull({
          noteToRender,
          noteCacheForRenderDict,
          dest: extra.dest,
          vault: vaults[0],
          fname: "root",
          config,
        }).process(note.body);
        return { resp };
      },
      verifyFuncDict: {
        [DendronASTDest.MD_DENDRON]: async ({ extra, engine }) => {
          const note = (await engine.getNote("foo")).data!;
          const { resp } = extra;
          expect(resp).toMatchSnapshot();
          expect(
            await AssertUtils.assertInString({
              body: resp.contents,
              match: [note.body],
            })
          ).toBeTruthy();
        },
        [DendronASTDest.HTML]: async ({ extra }) => {
          // don't show link since we're publishing
          const { resp } = extra;
          expect(resp).toMatchSnapshot();
          expect(
            await AssertUtils.assertInString({
              body: resp.contents,
              nomatch: ['href="bar.md"'],
            })
          ).toBeTruthy();
        },
      },
      preSetupHook: async ({ wsRoot, vaults }) => {
        const vault1 = vaults[0];
        TestConfigUtils.withConfig(
          (config) => {
            ConfigUtils.setPublishProp(config, "siteHierarchies", ["foo"]);
            return config;
          },
          { wsRoot }
        );
        await NoteTestUtilsV4.createNote({
          fname: "foo",
          vault: vault1,
          wsRoot,
          body: "![[dendron://vault1/bar]]",
          genRandomId: false,
        });
        await NoteTestUtilsV4.createNote({
          fname: "bar",
          vault: vault1,
          wsRoot,
          body: "two content",
        });
      },
    });

    const WILDCARD_WITHOUT_FOLLOWING_HEADER = createProcTests({
      name: "wildcard without a following header",
      setupFunc: async (opts) => {
        const { engine, vaults } = opts;
        return processTextV2({
          text: "![[foo.ch1#Reprehenderit:#*]]",
          dest: opts.extra.dest,
          engine,
          vault: vaults[0],
          fname: "foo",
        });
      },
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
        await modifyNote(opts, "foo.ch1", (note: NoteProps) => {
          const txt = [
            "Sint minus fuga omnis non.",
            "",
            "# Reprehenderit",
            "",
            "Sapiente sed accusamus eum.",
          ];
          note.body = txt.join("\n");
          return note;
        });
      },
      verifyFuncDict: {
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "Sapiente sed accusamus eum.");
          await checkNotInVFile(resp, "Sint minus fuga omnis non.");
        },
      },
    });

    const NO_TAGS_SECTION_IN_REFERENCES = createProcTests({
      name: "tags section shouldn't be included in references",
      setupFunc: async (opts) => {
        const { engine, vaults } = opts;
        return processTextV2({
          text: "![[foo.ch1]]",
          dest: opts.extra.dest,
          engine,
          vault: vaults[0],
          fname: "foo",
        });
      },
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
        await modifyNote(opts, "foo.ch1", (note: NoteProps) => {
          const txt = ["Sint minus fuga omnis non."];
          note.body = txt.join("\n");
          note.tags = ["sed", "eum"];
          return note;
        });
      },
      verifyFuncDict: {
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "Sint minus fuga omnis non.");
          await checkNotInVFile(resp, "Tags");
          await checkNotInVFile(resp, "sed", "eum");
        },
        [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "Sint minus fuga omnis non.");
          await checkNotInVFile(resp, "Tags");
          await checkNotInVFile(resp, "sed", "eum");
        },
      },
    });

    const ALL_TEST_CASES = [
      ...WILDCARD_WITHOUT_FOLLOWING_HEADER,
      ...WITH_PUBLISHING,
      ...WITH_START_AND_END_WILDCARD_ANCHOR,
      ...WITH_START_AND_END_ANCHOR,
      ...WILDCARD_CASE,
      ...REGULAR_CASE,
      ...RECURSIVE_TEST_CASES,
      ...WITH_ANCHOR,
      ...WITH_FM_TITLE,
      ...WITH_START_ANCHOR_INVALID,
      ...WITH_END_ANCHOR_INVALID,
      ...WITH_START_ANCHOR_OFFSET,
      ...XVAULT_CASE,
      ...WITH_NOTE_LINK_TITLE,
      ...WITH_ANCHOR_TO_SAME_FILE,
      ...NO_TAGS_SECTION_IN_REFERENCES,
    ];

    runAllTests({
      name: "compile",
      testCases: ALL_TEST_CASES,
    });
  });

  describe("with block anchors", () => {
    const IN_PARAGRAPH = createProcTests({
      name: "in paragraph",
      setupFunc: async (opts) => {
        const { engine, vaults } = opts;
        return processTextV2({
          text: "# Foo Bar\n![[foo.ch1#^block-anchor]]",
          dest: opts.extra.dest,
          engine,
          vault: vaults[0],
          fname: "foo",
        });
      },
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
        await modifyNote(opts, "foo.ch1", (note: NoteProps) => {
          const txt = [
            "Sapiente sed accusamus eum.",
            "Ullam optio est quia.",
            "",
            "Reprehenderit doloribus.",
            "Sint minus fuga omnis non. ^block-anchor",
            "",
            "Soluta ex qui.",
          ];
          note.body = txt.join("\n");
          return note;
        });
      },
      verifyFuncDict: {
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(
            resp,
            "Reprehenderit doloribus.",
            "Sint minus fuga omnis non."
          );
          await checkNotInVFile(
            resp,
            "Sapiente sed accusamus eum.",
            "Ullam optio est quia.",
            "Soluta ex qui."
          );
        },
      },
    });

    const AFTER_PARAGRAPH = createProcTests({
      name: "immediately after a paragraph",
      setupFunc: async (opts) => {
        const { engine, vaults } = opts;
        return processTextV2({
          text: "# Foo Bar\n![[foo.ch1#^block-anchor]]",
          dest: opts.extra.dest,
          engine,
          vault: vaults[0],
          fname: "foo",
        });
      },
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
        await modifyNote(opts, "foo.ch1", (note: NoteProps) => {
          const txt = [
            "Sapiente sed accusamus eum.",
            "Ullam optio est quia.",
            "",
            "Reprehenderit doloribus.",
            "Sint minus fuga omnis non.",
            "^block-anchor",
            "",
            "Soluta ex qui.",
          ];
          note.body = txt.join("\n");
          return note;
        });
      },
      verifyFuncDict: {
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(
            resp,
            "Reprehenderit doloribus.",
            "Sint minus fuga omnis non."
          );
          await checkNotInVFile(
            resp,
            "Sapiente sed accusamus eum.",
            "Ullam optio est quia.",
            "Soluta ex qui."
          );
        },
      },
    });

    const AFTER_PARAGRAPH_BLOCK = createProcTests({
      name: "after a paragraph block",
      setupFunc: async (opts) => {
        const { engine, vaults } = opts;
        return processTextV2({
          text: "# Foo Bar\n![[foo.ch1#^block-anchor]]",
          dest: opts.extra.dest,
          engine,
          vault: vaults[0],
          fname: "foo",
        });
      },
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
        await modifyNote(opts, "foo.ch1", (note: NoteProps) => {
          const txt = [
            "Sapiente sed accusamus eum.",
            "Ullam optio est quia.",
            "",
            "Reprehenderit doloribus.",
            "Sint minus fuga omnis non.",
            "",
            "^block-anchor",
            "",
            "Soluta ex qui.",
          ];
          note.body = txt.join("\n");
          return note;
        });
      },
      verifyFuncDict: {
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(
            resp,
            "Reprehenderit doloribus.",
            "Sint minus fuga omnis non."
          );
          await checkNotInVFile(
            resp,
            "Sapiente sed accusamus eum.",
            "Ullam optio est quia.",
            "Soluta ex qui."
          );
        },
      },
    });

    /** When the anchor is on a list element, it only references that element. */
    const LIST_ELEMENT = createProcTests({
      name: "list element",
      setupFunc: async (opts) => {
        const { engine, vaults } = opts;
        return processTextV2({
          text: "# Foo Bar\n![[foo.ch1#^block-anchor]]",
          dest: opts.extra.dest,
          engine,
          vault: vaults[0],
          fname: "foo",
        });
      },
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
        await modifyNote(opts, "foo.ch1", (note: NoteProps) => {
          const txt = [
            "* Sapiente sed accusamus eum.",
            "* Ullam optio est quia.",
            "* Reprehenderit doloribus. ^block-anchor",
            "* Sint minus fuga omnis non.",
          ];
          note.body = txt.join("\n");
          return note;
        });
      },
      verifyFuncDict: {
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "Reprehenderit doloribus.");
          await checkNotInVFile(
            resp,
            "Sapiente sed accusamus eum.",
            "Ullam optio est quia.",
            "Sint minus fuga omnis non."
          );
        },
      },
    });

    /** When the anchor is on a list element nested in another list, only the nested element is referenced. */
    const NESTED_LIST_ELEMENT = createProcTests({
      name: "nested list element",
      setupFunc: async (opts) => {
        const { engine, vaults } = opts;
        return processTextV2({
          text: "# Foo Bar\n![[foo.ch1#^block-anchor]]",
          dest: opts.extra.dest,
          engine,
          vault: vaults[0],
          fname: "foo",
          parsingDependenciesByFname: ["foo.ch1"],
        });
      },
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
        await modifyNote(opts, "foo.ch1", (note: NoteProps) => {
          const txt = [
            "* Ullam optio est quia.",
            "  * Laborum libero quia ducimus.",
            "  * Reprehenderit doloribus. ^block-anchor",
            "  * Iure neque alias dolorem.",
            "* Sint minus fuga omnis non.",
          ];
          note.body = txt.join("\n");
          return note;
        });
      },
      verifyFuncDict: {
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "Reprehenderit doloribus.");
          await checkNotInVFile(
            resp,
            "Ullam optio est quia.",
            "Laborum libero quia ducimus.",
            "Iure neque alias dolorem.",
            "Sint minus fuga omnis non."
          );
        },
      },
    });

    const NESTED_LIST_ELEMENT_TARGET_WITHOUT_CHILDREN = createProcTests({
      name: "nested list element targeting a single item without children",
      setupFunc: async (opts) => {
        const { engine, vaults } = opts;
        return processTextV2({
          text: "# Foo Bar\n![[foo.ch1#^block-anchor:#^block-anchor]]",
          dest: opts.extra.dest,
          engine,
          vault: vaults[0],
          fname: "foo",
          parsingDependenciesByFname: ["foo.ch1"],
        });
      },
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
        await modifyNote(opts, "foo.ch1", (note: NoteProps) => {
          const txt = [
            "* Iure neque alias dolorem.",
            "* Ullam optio est quia. ^block-anchor",
            "  * Laborum libero quia ducimus.",
            "  * Reprehenderit doloribus.",
            "* Sint minus fuga omnis non.",
          ];
          note.body = txt.join("\n");
          return note;
        });
      },
      verifyFuncDict: {
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "Ullam optio est quia.");
          await checkNotInVFile(
            resp,
            "Reprehenderit doloribus.",
            "Laborum libero quia ducimus.",
            "Iure neque alias dolorem.",
            "Sint minus fuga omnis non."
          );
        },
      },
    });

    const SINGLE_TOP_LEVEL_LIST = createProcTests({
      name: "a single top level list",
      setupFunc: async (opts) => {
        const { engine, vaults } = opts;
        return processTextV2({
          text: "# Foo Bar\n![[foo.ch1#^block-anchor]]",
          dest: opts.extra.dest,
          engine,
          vault: vaults[0],
          fname: "foo",
          parsingDependenciesByFname: ["foo.ch1"],
        });
      },
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
        await modifyNote(opts, "foo.ch1", (note: NoteProps) => {
          const txt = [
            "Ut temporibus quidem nihil corporis",
            "",
            "* Ullam optio est quia.",
            "  * Laborum libero quia ducimus.",
            "  * Reprehenderit doloribus. ^block-anchor",
            "  * Iure neque alias dolorem.",
          ];
          note.body = txt.join("\n");
          return note;
        });
      },
      verifyFuncDict: {
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "Reprehenderit doloribus.");
          await checkNotInVFile(
            resp,
            "Ut temporibus quidem nihil corporis",
            "Ullam optio est quia.",
            "Laborum libero quia ducimus.",
            "Iure neque alias dolorem.",
            "Sint minus fuga omnis non."
          );
        },
      },
    });

    /** When the anchor is immediately after the last list element, it only references the last element. */
    const AFTER_LIST = createProcTests({
      name: "immediately after last list element",
      setupFunc: async (opts) => {
        const { engine, vaults } = opts;
        return processTextV2({
          text: "# Foo Bar\n![[foo.ch1#^block-anchor]]",
          dest: opts.extra.dest,
          engine,
          vault: vaults[0],
          fname: "foo",
          parsingDependenciesByFname: ["foo.ch1"],
        });
      },
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
        await modifyNote(opts, "foo.ch1", (note: NoteProps) => {
          const txt = [
            "* Sapiente sed accusamus eum.",
            "* Ullam optio est quia.",
            "* Reprehenderit doloribus.",
            "* Sint minus fuga omnis non.",
            "^block-anchor",
          ];
          note.body = txt.join("\n");
          return note;
        });
      },
      verifyFuncDict: {
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "Sint minus fuga omnis non.");
          await checkNotInVFile(
            resp,
            "Sapiente sed accusamus eum.",
            "Ullam optio est quia.",
            "Reprehenderit doloribus."
          );
        },
      },
    });

    /** When it's a range within a list, it references list elements in between the anchors. */
    const LIST_RANGE = createProcTests({
      name: "range within list",
      setupFunc: async (opts) => {
        const { engine, vaults } = opts;
        return processTextV2({
          text: "# Foo Bar\n![[foo.ch1#^start:#^fin]]",
          dest: opts.extra.dest,
          engine,
          vault: vaults[0],
          fname: "foo",
          parsingDependenciesByFname: ["foo.ch1"],
        });
      },
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
        await modifyNote(opts, "foo.ch1", (note: NoteProps) => {
          const txt = [
            "* Sapiente sed accusamus eum.",
            "* Ullam optio est quia. ^start",
            "* Reprehenderit doloribus.",
            "* Sint minus fuga omnis non. ^fin",
            "* Iure neque alias dolorem.",
          ];
          note.body = txt.join("\n");
          return note;
        });
      },
      verifyFuncDict: {
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(
            resp,
            "Ullam optio est quia.",
            "Reprehenderit doloribus.",
            "Sint minus fuga omnis non."
          );
          await checkNotInVFile(
            resp,
            "Sapiente sed accusamus eum.",
            "Iure neque alias dolorem."
          );
        },
      },
    });

    /** When it's a range within a list crossing different levels, it references list elements in between the anchors, including the most common level. */
    const NESTED_LIST_RANGE = createProcTests({
      name: "range within nested lists",
      setupFunc: async (opts) => {
        const { engine, vaults } = opts;
        return processTextV2({
          text: "# Foo Bar\n![[foo.ch1#^start:#^fin]]",
          dest: opts.extra.dest,
          engine,
          vault: vaults[0],
          fname: "foo",
          parsingDependenciesByFname: ["foo.ch1"],
        });
      },
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
        await modifyNote(opts, "foo.ch1", (note: NoteProps) => {
          const txt = [
            "* Aut id architecto quia.",
            "* Sapiente sed accusamus eum.",
            "  * Ullam optio est quia. ^start",
            "* Reprehenderit doloribus.",
            "  * Sint minus fuga omnis non. ^fin",
            "  * Iure neque alias dolorem.",
          ];
          note.body = txt.join("\n");
          return note;
        });
      },
      verifyFuncDict: {
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(
            resp,
            "Sapiente sed accusamus eum.",
            "Ullam optio est quia.",
            "Reprehenderit doloribus.",
            "Sint minus fuga omnis non."
          );
          await checkNotInVFile(
            resp,
            "Aut id architecto quia.",
            "Iure neque alias dolorem."
          );
        },
      },
    });

    const ACROSS_LISTS_RANGE = createProcTests({
      name: "range across multiple lists",
      setupFunc: async (opts) => {
        const { engine, vaults } = opts;
        return processTextV2({
          text: "# Foo Bar\n![[foo.ch1#^start:#^fin]]",
          dest: opts.extra.dest,
          engine,
          vault: vaults[0],
          fname: "foo",
          parsingDependenciesByFname: ["foo.ch1"],
        });
      },
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
        await modifyNote(opts, "foo.ch1", (note: NoteProps) => {
          const txt = [
            "* Aut id architecto quia.",
            "* Ullam optio est quia. ^start",
            "* Reprehenderit doloribus.",
            "",
            "Sapiente sed accusamus eum.",
            "",
            "* Sint minus fuga omnis non. ^fin",
            "* Iure neque alias dolorem.",
          ];
          note.body = txt.join("\n");
          return note;
        });
      },
      verifyFuncDict: {
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(
            resp,
            "Ullam optio est quia.",
            "Reprehenderit doloribus.",
            "Sapiente sed accusamus eum.",
            "Sint minus fuga omnis non."
          );
          await checkNotInVFile(
            resp,
            "Aut id architecto quia.",
            "Iure neque alias dolorem."
          );
        },
      },
    });

    /** When the anchor is after the list and there is some space in between, it references the whole list. */
    const AFTER_LIST_BLOCK = createProcTests({
      name: "after list block",
      setupFunc: async (opts) => {
        const { engine, vaults } = opts;
        return processTextV2({
          text: "# Foo Bar\n![[foo.ch1#^block-anchor]]",
          dest: opts.extra.dest,
          engine,
          vault: vaults[0],
          fname: "foo",
          parsingDependenciesByFname: ["foo.ch1"],
        });
      },
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
        await modifyNote(opts, "foo.ch1", (note: NoteProps) => {
          const txt = [
            "Laborum libero quia ducimus.",
            "",
            "* Sapiente sed accusamus eum.",
            "* Ullam optio est quia.",
            "",
            "^block-anchor",
            "",
            "Iure neque alias dolorem.",
          ];
          note.body = txt.join("\n");
          return note;
        });
      },
      verifyFuncDict: {
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(
            resp,
            "Sapiente sed accusamus eum.",
            "Ullam optio est quia."
          );
          await checkNotInVFile(
            resp,
            "Laborum libero quia ducimus.",
            "Iure neque alias dolorem."
          );
        },
      },
    });

    const INVALID_START_BLOCK_ANCHOR = createProcTests({
      name: "range that has an invalid start block anchor",
      setupFunc: async (opts) => {
        const { engine, vaults } = opts;
        return processTextV2({
          text: "# Foo Bar\n![[foo.ch1#^invalid-start:#^fin]]",
          dest: opts.extra.dest,
          engine,
          vault: vaults[0],
          fname: "foo",
        });
      },
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
        await modifyNote(opts, "foo.ch1", (note: NoteProps) => {
          const txt = [
            "Aut id architecto quia.",
            "",
            "Ullam optio est quia. ^start",
            "",
            "Sint minus fuga omnis non. ^fin",
            "",
            "Iure neque alias dolorem.",
          ];
          note.body = txt.join("\n");
          return note;
        });
      },
      verifyFuncDict: {
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "not found");
          await checkNotInVFile(
            resp,
            "Aut id architecto quia.",
            "Ullam optio est quia.",
            "Sint minus fuga omnis non.",
            "Iure neque alias dolorem."
          );
        },
      },
    });

    const INVALID_END_BLOCK_ANCHOR = createProcTests({
      name: "range that has an invalid end block anchor",
      setupFunc: async (opts) => {
        const { engine, vaults } = opts;
        return processTextV2({
          text: "# Foo Bar\n![[foo.ch1#^start:#^invalid-end]]",
          dest: opts.extra.dest,
          engine,
          vault: vaults[0],
          fname: "foo",
        });
      },
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
        await modifyNote(opts, "foo.ch1", (note: NoteProps) => {
          const txt = [
            "Aut id architecto quia.",
            "",
            "Ullam optio est quia. ^start",
            "",
            "Sint minus fuga omnis non. ^fin",
            "",
            "Iure neque alias dolorem.",
          ];
          note.body = txt.join("\n");
          return note;
        });
      },
      verifyFuncDict: {
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "not found");
          await checkNotInVFile(
            resp,
            "Aut id architecto quia.",
            "Ullam optio est quia.",
            "Sint minus fuga omnis non.",
            "Iure neque alias dolorem."
          );
        },
      },
    });

    const NESTED_REFERENCES = createProcTests({
      name: "a reference inside a reference",
      setupFunc: async (opts) => {
        const { engine, vaults } = opts;
        return processTextV2({
          text: "# Foo Bar\n![[foo.ch1#^start2:#^fin2]]",
          dest: opts.extra.dest,
          engine,
          vault: vaults[0],
          fname: "foo",
        });
      },
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
        await modifyNote(opts, "foo.ch1", (note: NoteProps) => {
          const txt = [
            "Sint minus fuga omnis non.",
            "",
            "Aut id architecto quia. ^start1",
            "",
            "Sapiente sed accusamus eum. ^fin1",
            "",
            "Ullam optio est quia. ^start2",
            "",
            "![[foo.ch1#^start1:#^fin1]]",
            "",
            "Reprehenderit doloribus. ^fin2",
            "",
            "Iure neque alias dolorem.",
          ];
          note.body = txt.join("\n");
          return note;
        });
      },
      verifyFuncDict: {
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          checkVFile(
            resp,
            "Ullam optio est quia.",
            "Reprehenderit doloribus.",
            "Aut id architecto quia.",
            "Sapiente sed accusamus eum."
          );
          checkNotInVFile(
            resp,
            "Iure neque alias dolorem.",
            "Sint minus fuga omnis non."
          );
        },
      },
    });

    const SAME_FILE_NESTED_REFERENCES = createProcTests({
      name: "a reference inside a reference, all using same file references",
      setupFunc: async (opts) => {
        const { engine, vaults } = opts;
        return processTextV2({
          text: "# Foo Bar\n![[foo.ch1#^start2:#^fin2]]",
          dest: opts.extra.dest,
          engine,
          vault: vaults[0],
          fname: "foo",
        });
      },
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
        await modifyNote(opts, "foo.ch1", (note: NoteProps) => {
          const txt = [
            "Sint minus fuga omnis non.",
            "",
            "Aut id architecto quia. ^start1",
            "",
            "Sapiente sed accusamus eum. ^fin1",
            "",
            "Ullam optio est quia. ^start2",
            "",
            "![[#^start1:#^fin1]]",
            "",
            "Reprehenderit doloribus. ^fin2",
            "",
            "Iure neque alias dolorem.",
          ];
          note.body = txt.join("\n");
          return note;
        });
      },
      verifyFuncDict: {
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          checkVFile(
            resp,
            "Ullam optio est quia.",
            "Reprehenderit doloribus.",
            "Aut id architecto quia.",
            "Sapiente sed accusamus eum."
          );
          checkNotInVFile(
            resp,
            "Iure neque alias dolorem.",
            "Sint minus fuga omnis non."
          );
        },
      },
    });

    const LIST_TO_PARAGRAPH = createProcTests({
      name: "range from a list to a paragraph",
      setupFunc: async (opts) => {
        const { engine, vaults } = opts;
        return processTextV2({
          text: "# Foo Bar\n![[foo.ch1#^start:#^fin]]",
          dest: opts.extra.dest,
          engine,
          vault: vaults[0],
          fname: "foo",
          parsingDependenciesByFname: ["foo.ch1"],
        });
      },
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
        await modifyNote(opts, "foo.ch1", (note: NoteProps) => {
          const txt = [
            "* Aut id architecto quia.",
            "* Ullam optio est quia. ^start",
            "* Reprehenderit doloribus.",
            "",
            "Sapiente sed accusamus eum.",
            "Sint minus fuga omnis non. ^fin",
            "",
            "Iure neque alias dolorem.",
          ];
          note.body = txt.join("\n");
          return note;
        });
      },
      verifyFuncDict: {
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(
            resp,
            "Ullam optio est quia.",
            "Reprehenderit doloribus.",
            "Sapiente sed accusamus eum.",
            "Sint minus fuga omnis non."
          );
          await checkNotInVFile(
            resp,
            "Aut id architecto quia.",
            "Iure neque alias dolorem."
          );
        },
      },
    });

    const PARAGRAPH_TO_LIST = createProcTests({
      name: "range from a paragraph to a list",
      setupFunc: async (opts) => {
        const { engine, vaults } = opts;
        return processTextV2({
          text: "# Foo Bar\n![[foo.ch1#^start:#^fin]]",
          dest: opts.extra.dest,
          engine,
          vault: vaults[0],
          fname: "foo",
          parsingDependenciesByFname: ["foo.ch1"],
        });
      },
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
        await modifyNote(opts, "foo.ch1", (note: NoteProps) => {
          const txt = [
            "Maxime aut modi.",
            "",
            "Sint minus fuga omnis non.",
            "Sapiente sed accusamus eum. ^start",
            "",
            "* Reprehenderit doloribus.",
            "* Ullam optio est quia. ^fin",
            "* Aut id architecto quia.",
            "",
            "Iure neque alias dolorem.",
          ];
          note.body = txt.join("\n");
          return note;
        });
      },
      verifyFuncDict: {
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(
            resp,
            "Ullam optio est quia.",
            "Reprehenderit doloribus.",
            "Sapiente sed accusamus eum.",
            "Sint minus fuga omnis non."
          );
          await checkNotInVFile(
            resp,
            "Maxime aut modi.",
            "Aut id architecto quia.",
            "Iure neque alias dolorem."
          );
        },
      },
    });

    const HEADER_TO_BLOCK_ANCHOR = createProcTests({
      name: "range from a header to a block anchor",
      setupFunc: async (opts) => {
        const { engine, vaults } = opts;
        return processTextV2({
          text: "# Foo Bar\n![[foo.ch1#start:#^fin]]",
          dest: opts.extra.dest,
          engine,
          vault: vaults[0],
          fname: "foo",
          parsingDependenciesByFname: ["foo.ch1"],
        });
      },
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
        await modifyNote(opts, "foo.ch1", (note: NoteProps) => {
          const txt = [
            "# start",
            "",
            "Sint minus fuga omnis non.",
            "Sapiente sed accusamus eum. ^fin",
            "",
            "Aut id architecto quia.",
            "Iure neque alias dolorem.",
          ];
          note.body = txt.join("\n");
          return note;
        });
      },
      verifyFuncDict: {
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(
            resp,
            "start",
            "Sapiente sed accusamus eum.",
            "Sint minus fuga omnis non."
          );
          await checkNotInVFile(
            resp,
            "Aut id architecto quia.",
            "Iure neque alias dolorem."
          );
        },
      },
    });

    const BLOCK_ANCHOR_TO_HEADER = createProcTests({
      name: "range from a block anchor to a header",
      setupFunc: async (opts) => {
        const { engine, vaults } = opts;
        return processTextV2({
          text: "# Foo Bar\n![[foo.ch1#^start:#end]]",
          dest: opts.extra.dest,
          engine,
          vault: vaults[0],
          fname: "foo",
          parsingDependenciesByFname: ["foo.ch1"],
        });
      },
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
        await modifyNote(opts, "foo.ch1", (note: NoteProps) => {
          const txt = [
            "Iure neque alias dolorem.",
            "",
            "Sint minus fuga omnis non.",
            "Sapiente sed accusamus eum. ^start",
            "",
            "# end",
            "",
            "Aut id architecto quia.",
          ];
          note.body = txt.join("\n");
          return note;
        });
      },
      verifyFuncDict: {
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(
            resp,
            "Sapiente sed accusamus eum.",
            "Sint minus fuga omnis non."
          );
          await checkNotInVFile(
            resp,
            "Aut id architecto quia.",
            "Iure neque alias dolorem."
          );
        },
      },
    });

    /** When the anchor is anywhere in or after a table, it references the whole table. */
    const IN_TABLE = createProcTests({
      name: "in table",
      setupFunc: async (opts) => {
        const { engine, vaults } = opts;
        return processTextV2({
          text: "# Foo Bar\n![[foo.ch1#^block-anchor]]",
          dest: opts.extra.dest,
          engine,
          vault: vaults[0],
          fname: "foo",
          parsingDependenciesByFname: ["foo.ch1"],
        });
      },
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
        await modifyNote(opts, "foo.ch1", (note: NoteProps) => {
          const txt = [
            "Minima expedita vero.",
            "",
            "| Sapiente | accusamus |",
            "|----------|-----------|",
            "| Laborum  | libero    | ^block-anchor",
            "| Ullam    | optio     |",
            "",
            "Iure neque alias dolorem.",
          ];
          note.body = txt.join("\n");
          return note;
        });
      },
      verifyFuncDict: {
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(
            resp,
            "Sapiente",
            "accusamus",
            "Laborum",
            "libero",
            "Ullam",
            "optio"
          );
          await checkNotInVFile(
            resp,
            "Minima expedita vero.",
            "Iure neque alias dolorem."
          );
        },
      },
    });

    /** When the anchor is anywhere in or after a table, it references the whole table. */
    const AFTER_TABLE = createProcTests({
      name: "after table",
      setupFunc: async (opts) => {
        const { engine, vaults } = opts;
        return processTextV2({
          text: "# Foo Bar\n![[foo.ch1#^block-anchor]]",
          dest: opts.extra.dest,
          engine,
          vault: vaults[0],
          fname: "foo",
          parsingDependenciesByFname: ["foo.ch1"],
        });
      },
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
        await modifyNote(opts, "foo.ch1", (note: NoteProps) => {
          const txt = [
            "Laborum libero quia ducimus.",
            "",
            "| Sapiente | accusamus |",
            "|----------|-----------|",
            "| Laborum  | libero    |",
            "| Ullam    | optio     |",
            "^block-anchor",
            "",
            "Iure neque alias dolorem.",
          ];
          note.body = txt.join("\n");
          return note;
        });
      },
      verifyFuncDict: {
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(
            resp,
            "Sapiente",
            "accusamus",
            "Laborum",
            "libero",
            "Ullam",
            "optio"
          );
          await checkNotInVFile(
            resp,
            "Minima expedita vero.",
            "Iure neque alias dolorem."
          );
        },
      },
    });

    /** When the anchor is anywhere in or after a table, it references the whole table. */
    const AFTER_TABLE_BLOCK = createProcTests({
      name: "after table block",
      setupFunc: async (opts) => {
        const { engine, vaults } = opts;
        return processTextV2({
          text: "# Foo Bar\n![[foo.ch1#^block-anchor]]",
          dest: opts.extra.dest,
          engine,
          vault: vaults[0],
          fname: "foo",
          parsingDependenciesByFname: ["foo.ch1"],
        });
      },
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
        await modifyNote(opts, "foo.ch1", (note: NoteProps) => {
          const txt = [
            "Laborum libero quia ducimus.",
            "",
            "| Sapiente | accusamus |",
            "|----------|-----------|",
            "| Laborum  | libero    |",
            "| Ullam    | optio     |",
            "",
            "^block-anchor",
            "",
            "Iure neque alias dolorem.",
          ];
          note.body = txt.join("\n");
          return note;
        });
      },
      verifyFuncDict: {
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(
            resp,
            "Sapiente",
            "accusamus",
            "Laborum",
            "libero",
            "Ullam",
            "optio"
          );
          await checkNotInVFile(
            resp,
            "Minima expedita vero.",
            "Iure neque alias dolorem."
          );
        },
      },
    });

    /** Tests both that the footnotes are only rendered when referenced, and also that they get rendered even if they get sliced out in the note reference. */
    const WITH_FOOTNOTES = createProcTests({
      name: "with footnotes",
      setupFunc: async (opts) => {
        const { engine, vaults } = opts;
        return processTextV2({
          text: [
            "# Illum Nostrum",
            "",
            "Illum in aut eos voluptas nostrum possimus commodi. [^quo]",
            "",
            "![[foo.ch1#start:#end]]",
            "",
            "[^quo]: Id et velit ducimus quo ut.",
          ].join("\n"),
          dest: opts.extra.dest,
          engine,
          vault: vaults[0],
          fname: "foo",
          parsingDependenciesByFname: ["foo.ch1"],
        });
      },
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
        await modifyNote(opts, "foo.ch1", (note: NoteProps) => {
          const txt = [
            "# start",
            "",
            "Laborum libero quia ducimus.",
            "",
            "Iure neque alias dolorem. [^minus]",
            "",
            "# end",
            "",
            "[^minus]: Et porro minus facilis qui.",
            "[^eos]: In eos et aperiam hic necessitatibus aperiam.",
          ];
          note.body = txt.join("\n");
          return note;
        });
      },
      verifyFuncDict: {
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(
            resp,
            "Id et velit ducimus quo ut.",
            "Et porro minus facilis qui."
          );
          await checkNotInVFile(
            resp,
            "In eos et aperiam hic necessitatibus aperiam."
          );
        },
      },
    });

    runAllTests({
      name: "compile",
      testCases: [
        ...IN_PARAGRAPH,
        ...AFTER_PARAGRAPH,
        ...AFTER_PARAGRAPH_BLOCK,
        ...INVALID_START_BLOCK_ANCHOR,
        ...INVALID_END_BLOCK_ANCHOR,
        ...NESTED_REFERENCES,
        ...SAME_FILE_NESTED_REFERENCES,
        ...LIST_ELEMENT,
        ...NESTED_LIST_ELEMENT,
        ...NESTED_LIST_ELEMENT_TARGET_WITHOUT_CHILDREN,
        ...AFTER_LIST,
        ...AFTER_LIST_BLOCK,
        ...IN_TABLE,
        ...AFTER_TABLE,
        ...AFTER_TABLE_BLOCK,
        ...LIST_RANGE,
        ...ACROSS_LISTS_RANGE,
        ...NESTED_LIST_RANGE,
        ...LIST_TO_PARAGRAPH,
        ...PARAGRAPH_TO_LIST,
        ...HEADER_TO_BLOCK_ANCHOR,
        ...BLOCK_ANCHOR_TO_HEADER,
        ...SINGLE_TOP_LEVEL_LIST,
        ...WITH_FOOTNOTES,
      ],
    });
  });

  describe("WHEN note ref missing", () => {
    runTestCases(
      createProcCompileTests({
        name: "NOTE_REF_MISSING",
        setup: async (opts) => {
          const { proc } = getOpts(opts);
          const txt = `![[alpha.md]]`;
          const resp = await proc.process(txt);
          return { resp, proc };
        },
        verify: {
          [DendronASTDest.HTML]: {
            [ProcFlavor.REGULAR]: async ({ extra }) => {
              const { resp } = extra;
              await checkString(resp.contents, "No note with name alpha found");
            },
            [ProcFlavor.PREVIEW]: ProcFlavor.REGULAR,
            [ProcFlavor.PUBLISHING]: ProcFlavor.REGULAR,
          },
        },
        preSetupHook: async (opts) => {
          await ENGINE_HOOKS.setupBasic({ ...opts, extra: { idv2: true } });
        },
      })
    );
  });

  describe("WHEN assetPrefix set", () => {
    runTestCases(
      createProcCompileTests({
        name: "ASSET_PREFIX_SET",
        setup: async (opts) => {
          const { proc } = getOpts(opts);

          const noteCacheForRenderDict = NoteDictsUtils.createNoteDicts([
            (await opts.engine.getNote("bar")).data!, // Adding the note foo to the dictionary
          ]);
          MDUtilsV5.setProcData(proc, { noteCacheForRenderDict });

          const txt = `![[bar.md]]`;
          const resp = await proc.process(txt);
          return { resp, proc };
        },
        verify: {
          [DendronASTDest.HTML]: {
            [ProcFlavor.PUBLISHING]: async ({ extra }) => {
              const { resp } = extra;
              expect(resp).toMatchSnapshot();
              await checkString(
                resp.contents,
                '<iframe class="noteref-iframe" src="/some-prefix/refs/bar---0"'
              );
            },
          },
        },
        preSetupHook: async (opts) => {
          await ENGINE_HOOKS.setupBasic({ ...opts, extra: { idv2: true } });
          TestConfigUtils.withConfig(
            (config) => {
              ConfigUtils.setPublishProp(
                config,
                "assetsPrefix",
                "/some-prefix"
              );
              config.dev = {
                ...config.dev,
                enableExperimentalIFrameNoteRef: true,
              };
              return config;
            },
            { wsRoot: opts.wsRoot }
          );
        },
      })
    );
  });

  describe("WHEN note ref to html AND prettyLinks = true", () => {
    runTestCases(
      createProcCompileTests({
        name: "NOTE_REF_WITH_REHYPE",
        setup: async (opts) => {
          const { proc } = getOpts(opts);
          const txt = `![[alpha.md]]`;

          const noteCacheForRenderDict = NoteDictsUtils.createNoteDicts([
            (await opts.engine.getNote("alpha-id")).data!, // Adding the note foo to the dictionary
          ]);
          MDUtilsV5.setProcData(proc, { noteCacheForRenderDict });

          const resp = await proc.process(txt);
          return { resp, proc };
        },
        verify: {
          [DendronASTDest.HTML]: {
            [ProcFlavor.REGULAR]: async ({ extra }) => {
              const { resp } = extra;
              expect(resp).toMatchSnapshot();
              await checkVFile(
                resp,
                // should have id for link
                `<a href="alpha-id"`,
                // html quoted
                `<p><a href="bar">bar</a></p>`
              );
              await checkNotInString(
                resp.contents,
                // should not have title
                `Alpha<h1>`
              );
            },
            [ProcFlavor.PREVIEW]: ProcFlavor.REGULAR,
            [ProcFlavor.PUBLISHING]: async ({ extra }) => {
              const { resp } = extra;
              expect(resp).toMatchSnapshot();
              await checkString(
                resp.contents,
                `<iframe class="noteref-iframe" src="/refs/alpha-id---0"`
              );
            },
          },
        },
        preSetupHook: async (opts) => {
          await ENGINE_HOOKS.setupBasic({ ...opts, extra: { idv2: true } });
          await NoteTestUtilsV4.createNote({
            fname: "alpha",
            body: "[[bar]]",
            vault: opts.vaults[0],
            wsRoot: opts.wsRoot,
            props: { id: "alpha-id" },
          });
          TestConfigUtils.withConfig(
            (config) => {
              ConfigUtils.setPublishProp(config, "enablePrettyLinks", true);
              config.dev = {
                ...config.dev,
                enableExperimentalIFrameNoteRef: true,
              };
              return config;
            },
            { wsRoot: opts.wsRoot }
          );
        },
      })
    );
  });
});
