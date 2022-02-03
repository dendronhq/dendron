import {
  NoteTestUtilsV4,
  TestPresetEntryV4,
} from "@dendronhq/common-test-utils";
import {
  DendronASTData,
  DendronASTDest,
  DendronASTTypes,
  DEngineClient,
  MDUtilsV4,
  UnistNode,
  WikiLinkNoteV4,
  wikiLinks,
  WikiLinksOpts,
} from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
import { runEngineTestV5 } from "../../../engine";
import { ENGINE_HOOKS } from "../../../presets";
import { checkVFile, createProcForTest, createProcTests } from "./utils";

function proc(
  engine: DEngineClient,
  dendron: DendronASTData,
  opts?: WikiLinksOpts
) {
  return MDUtilsV4.proc({ engine })
    .data("dendron", dendron)
    .use(wikiLinks, opts);
}

function genDendronData(opts?: Partial<DendronASTData>): DendronASTData {
  return { ...opts } as any;
}

function getWikiLink(node: UnistNode): WikiLinkNoteV4 {
  // @ts-ignore
  return node.children[0].children[0];
}

function getNode(node: UnistNode): UnistNode {
  // @ts-ignore
  return node.children[0].children[0];
}

describe("wikiLinks", () => {
  describe("parse", () => {
    let engine: any;
    const dendronData = {
      fname: "placeholder.md",
      dest: DendronASTDest.MD_REGULAR,
    };

    test("basic", () => {
      const resp = proc(engine, genDendronData(dendronData)).parse(
        `[[foo.md]]`
      );
      expect(getWikiLink(resp).type).toEqual("wikiLink");
    });

    test("link with space", () => {
      const resp = proc(engine, genDendronData(dendronData)).parse(
        `[[foo bar]]`
      );
      expect(_.pick(getWikiLink(resp), ["type", "value"])).toEqual({
        type: DendronASTTypes.WIKI_LINK,
        value: "foo bar",
      });
    });

    test("fail: bad format", () => {
      const resp = proc(engine, genDendronData(dendronData)).parse(
        `[[[foo bar]]]`
      );
      expect(resp).toMatchSnapshot();
      expect(getNode(resp).type).toEqual("text");
    });

    test("doesn't parse inline code block", () => {
      const resp = proc(engine, genDendronData(dendronData)).parse(
        "`[[foo.md]]`"
      );
      expect(getWikiLink(resp).type).toEqual("inlineCode");
    });

    describe("block references", () => {
      test("block reference to different file", () => {
        const resp = proc(engine, genDendronData(dendronData)).parse(
          `[[lorem-ipsum#^block-id]]`
        );
        const wikiLink = getWikiLink(resp);
        expect(_.pick(wikiLink, ["type", "value"])).toEqual({
          type: DendronASTTypes.WIKI_LINK,
          value: "lorem-ipsum",
        });
        expect(wikiLink.data.anchorHeader).toEqual("^block-id");
      });

      test("block reference to same file", () => {
        const resp = proc(engine, genDendronData(dendronData)).parse(
          `[[#^block-id]]`
        );
        const wikiLink = getWikiLink(resp);
        expect(_.pick(wikiLink, ["type", "value"])).toEqual({
          type: DendronASTTypes.WIKI_LINK,
          value: "placeholder",
        });
        expect(wikiLink.data.anchorHeader).toEqual("^block-id");
      });

      test("avoids parsing broken links", () => {
        const resp = proc(engine, genDendronData(dendronData)).parse(`[[#]]`);
        const wikiLink = getWikiLink(resp);
        expect(wikiLink.type).not.toEqual(DendronASTTypes.WIKI_LINK);
      });
    });
  });

  describe("compile", () => {
    const linkRegular = "[[foo]]";

    const REGULAR_CASE = createProcTests({
      name: "regular",
      setupFunc: async ({ engine, vaults, extra }) => {
        const proc2 = createProcForTest({
          engine,
          dest: extra.dest,
          vault: vaults[0],
        });
        const resp = await proc2.process(linkRegular);
        return { resp, proc };
      },
      verifyFuncDict: {
        [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, linkRegular);
        },
        [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "[Foo](foo)");
        },
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, '<a href="foo">Foo</a>');
        },
        [DendronASTDest.MD_ENHANCED_PREVIEW]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "[Foo](foo.md)");
        },
      },
      preSetupHook: ENGINE_HOOKS.setupBasic,
    });

    const linkWithAnchor = "[[foo#one]]";
    const WITH_ANCHOR = createProcTests({
      name: "WITH_ANCHOR",
      setupFunc: async ({ engine, vaults, extra }) => {
        const proc2 = createProcForTest({
          engine,
          dest: extra.dest,
          vault: vaults[0],
        });
        const resp = await proc2.process(linkWithAnchor);
        return { resp, proc };
      },
      verifyFuncDict: {
        [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, linkWithAnchor);
        },
        [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "[Foo](foo)");
        },
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, '<a href="foo#one">Foo</a>');
        },
        [DendronASTDest.MD_ENHANCED_PREVIEW]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "[Foo](foo.md)");
        },
      },
      preSetupHook: ENGINE_HOOKS.setupBasic,
    });

    const linkWithBlockAnchor = "[[foo#^block]]";
    const WITH_BLOCK_ANCHOR = createProcTests({
      name: "WITH_BLOCK_ANCHOR",
      setupFunc: async ({ engine, vaults, extra }) => {
        const proc2 = createProcForTest({
          engine,
          dest: extra.dest,
          vault: vaults[0],
        });
        const resp = await proc2.process(linkWithBlockAnchor);
        return { resp, proc };
      },
      verifyFuncDict: {
        [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, linkWithBlockAnchor);
        },
        [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "[Foo](foo)");
        },
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, '<a href="foo#^block">Foo</a>');
        },
        [DendronASTDest.MD_ENHANCED_PREVIEW]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "[Foo](foo.md)");
        },
      },
      preSetupHook: ENGINE_HOOKS.setupBasic,
    });

    const WITH_SAME_FILE_BLOCK_ANCHOR = createProcTests({
      name: "WITH_SAME_FILE_BLOCK_ANCHOR",
      setupFunc: async ({ engine, vaults, extra }) => {
        const proc2 = createProcForTest({
          engine,
          dest: extra.dest,
          vault: vaults[0],
        });
        const resp = await proc2.process("[[#^block]]");
        return { resp, proc };
      },
      verifyFuncDict: {
        [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "[[root#^block]]");
        },
        [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "[Root](root)");
        },
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, '<a href="root#^block">Root</a>');
        },
        [DendronASTDest.MD_ENHANCED_PREVIEW]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "[Root](root.md)");
        },
      },
      preSetupHook: ENGINE_HOOKS.setupBasic,
    });

    const linkWithExtension = "[[foo.md]]";
    const WITH_EXTENSION = createProcTests({
      name: "WITH_EXTENSION",
      setupFunc: async ({ engine, vaults, extra }) => {
        const proc = createProcForTest({
          engine,
          dest: extra.dest,
          vault: vaults[0],
        });
        const resp = await proc.process(linkWithExtension);
        return { resp, proc };
      },
      verifyFuncDict: {
        [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "[[foo]]");
        },
        [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "[Foo](foo)");
        },
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, '<a href="foo">Foo</a>');
        },
        [DendronASTDest.MD_ENHANCED_PREVIEW]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "[Foo](foo.md)");
        },
      },
      preSetupHook: ENGINE_HOOKS.setupBasic,
    });

    const linkWithAlias = `[[bar doesn't foo|foo]]`;
    const WITH_ALIAS = createProcTests({
      name: "WITH_ALIAS",
      setupFunc: async ({ engine, vaults, extra }) => {
        const proc = createProcForTest({
          engine,
          dest: extra.dest,
          vault: vaults[0],
        });
        const resp = await proc.process(linkWithAlias);
        return { resp, proc };
      },
      verifyFuncDict: {
        [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, linkWithAlias);
        },
        [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "[bar doesn't foo](foo)");
        },
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, `<a href="foo">bar doesn't foo</a>`);
        },
        [DendronASTDest.MD_ENHANCED_PREVIEW]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "[bar doesn't foo](foo.md)");
        },
      },
      preSetupHook: ENGINE_HOOKS.setupBasic,
    });

    const linkWithAliasHash = `[[#bar|foo]]`;
    const WITH_ALIAS_HASH = createProcTests({
      name: "WITH_ALIAS_HASH",
      setupFunc: async ({ engine, vaults, extra }) => {
        const proc = createProcForTest({
          engine,
          dest: extra.dest,
          vault: vaults[0],
        });
        const resp = await proc.process(linkWithAliasHash);
        return { resp, proc };
      },
      verifyFuncDict: {
        [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, linkWithAliasHash);
        },
        [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "[#bar](foo)");
        },
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, '<a href="foo">#bar</a>');
        },
        [DendronASTDest.MD_ENHANCED_PREVIEW]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "[#bar](foo.md)");
        },
      },
      preSetupHook: ENGINE_HOOKS.setupBasic,
    });

    const linkWithAliasApostrophe = `[[Coulomb's Constant|kb.note.20211011124050]]`;
    const WITH_ALIAS_APOSTROPHE = createProcTests({
      name: "WITH_ALIAS_APOSTROPHE",
      setupFunc: async ({ engine, vaults, extra }) => {
        const proc = createProcForTest({
          engine,
          dest: extra.dest,
          vault: vaults[0],
        });
        const resp = await proc.process(linkWithAliasApostrophe);
        return { resp, proc };
      },
      verifyFuncDict: {
        [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, linkWithAliasApostrophe);
        },
        [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(
            resp,
            "[Coulomb's Constant](kb.note.20211011124050)"
          );
        },
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(
            resp,
            '<a href="kb.note.20211011124050">Coulomb\'s Constant</a>'
          );
        },
        [DendronASTDest.MD_ENHANCED_PREVIEW]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(
            resp,
            "[Coulomb's Constant](kb.note.20211011124050.md)"
          );
        },
      },
      preSetupHook: ENGINE_HOOKS.setupBasic,
    });

    const WITH_ID_AS_LINK = createProcTests({
      name: "WITH_ID_AS_LINK",
      setupFunc: async ({ engine, vaults, extra }) => {
        const proc = createProcForTest({
          engine,
          dest: extra.dest,
          vault: vaults[0],
          useIdAsLink: true,
        });
        const resp = await proc.process(linkRegular);
        return { resp, proc };
      },
      verifyFuncDict: {
        [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, linkRegular);
        },
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, '<a href="foo-id">Foo</a>');
        },
      },
      preSetupHook: async ({ wsRoot, vaults }) => {
        await NoteTestUtilsV4.createNote({
          wsRoot,
          fname: "foo",
          vault: vaults[0],
          props: { id: "foo-id" },
        });
      },
    });

    const linkWithSpaceAndAlias = `[[bar|foo bar]]`;
    const WITH_SPACE_AND_ALIAS = createProcTests({
      name: "WITH_SPACE_AND_ALIAS",
      setupFunc: async ({ engine, vaults, extra }) => {
        const proc = createProcForTest({
          engine,
          dest: extra.dest,
          vault: vaults[0],
        });
        const resp = await proc.process(linkWithSpaceAndAlias);
        return { resp, proc };
      },
      verifyFuncDict: {
        [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, linkWithSpaceAndAlias);
        },
        [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "[bar](foo%20bar)");
        },
        [DendronASTDest.MD_ENHANCED_PREVIEW]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "[bar](foo%20bar.md)");
        },
      },
      preSetupHook: ENGINE_HOOKS.setupBasic,
    });

    const linkFromSameVaultWithAlias = "[[bar|dendron://vault1/foo]]";
    const WITH_XVAULT_LINK_TO_SAME_VAULT_AND_ALIAS = createProcTests({
      name: "WITH_XVAULT_LINK_TO_SAME_VAULT_AND_ALIAS",
      setupFunc: async ({ engine, vaults, extra }) => {
        const proc = createProcForTest({
          engine,
          dest: extra.dest,
          vault: vaults[0],
        });
        const resp = await proc.process(linkFromSameVaultWithAlias);
        return { resp, proc };
      },
      verifyFuncDict: {
        [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, linkFromSameVaultWithAlias);
        },
        [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "[bar](foo)");
        },
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, '<a href="foo">bar</a>');
        },
        [DendronASTDest.MD_ENHANCED_PREVIEW]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "[bar](foo.md)");
        },
      },
      preSetupHook: ENGINE_HOOKS.setupBasic,
    });

    const linkFromSameVault = "[[dendron://vault1/foo]]";
    const WITH_XVAULT_LINK_TO_SAME_VAULT = createProcTests({
      name: "WITH_XVAULT_LINK_TO_SAME_VAULT",
      setupFunc: async ({ engine, vaults, extra }) => {
        const proc = createProcForTest({
          engine,
          dest: extra.dest,
          vault: vaults[0],
        });
        const resp = await proc.process(linkFromSameVault);
        return { resp, proc };
      },
      verifyFuncDict: {
        [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, linkFromSameVault);
        },
        [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "[Foo](foo)");
        },
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, '<a href="foo">Foo</a>');
        },
        [DendronASTDest.MD_ENHANCED_PREVIEW]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "[Foo](foo.md)");
        },
      },
      preSetupHook: ENGINE_HOOKS.setupBasic,
    });

    const linkFromOtherVault = "[[dendron://vault2/foo]]";
    const WITH_XVAULT_LINK_TO_OTHER_VAULT = createProcTests({
      name: "WITH_XVAULT_LINK_TO_OTHER_VAULT",
      setupFunc: async ({ engine, vaults, extra }) => {
        const proc = createProcForTest({
          engine,
          dest: extra.dest,
          vault: vaults[0],
          useIdAsLink: true,
        });
        const resp = await proc.process(linkFromOtherVault);
        return { resp, proc };
      },
      verifyFuncDict: {
        [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, linkFromOtherVault);
        },
        [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, "[Foo](foo)");
        },
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(resp, '<a href="foo-2">Foo</a>');
        },
        [DendronASTDest.MD_ENHANCED_PREVIEW]: async ({ extra }) => {
          const { resp } = extra;
          const expectedPath = path.join("..", "vault2", "foo.md");
          await checkVFile(resp, `[Foo](${expectedPath})`);
        },
      },
      preSetupHook: async ({ wsRoot, vaults }) => {
        const vault2 = vaults[1];
        await NoteTestUtilsV4.createNote({
          fname: "foo",
          wsRoot,
          vault: vault2,
          props: {
            id: "foo-2",
          },
        });
      },
    });

    const ALL_TEST_CASES = [
      ...REGULAR_CASE,
      ...WITH_ANCHOR,
      ...WITH_BLOCK_ANCHOR,
      ...WITH_SAME_FILE_BLOCK_ANCHOR,
      ...WITH_EXTENSION,
      ...WITH_ALIAS,
      ...WITH_ALIAS_HASH,
      ...WITH_ALIAS_APOSTROPHE,
      ...WITH_ID_AS_LINK,
      ...WITH_SPACE_AND_ALIAS,
      ...WITH_XVAULT_LINK_TO_SAME_VAULT,
      ...WITH_XVAULT_LINK_TO_OTHER_VAULT,
      ...WITH_XVAULT_LINK_TO_SAME_VAULT_AND_ALIAS,
    ];

    test.each(
      ALL_TEST_CASES.map((ent) => [`${ent.dest}: ${ent.name}`, ent.testCase])
      // @ts-ignore
    )("%p", async (_key, testCase: TestPresetEntryV4) => {
      await runEngineTestV5(testCase.testFunc, {
        expect,
        preSetupHook: testCase.preSetupHook,
      });
    });
  });
});
