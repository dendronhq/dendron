import { DConfig } from "@dendronhq/common-server";
import { AssertUtils, TestPresetEntryV4 } from "@dendronhq/common-test-utils";
import {
  ExtendedImage,
  DendronASTDest,
  DendronASTTypes,
  MDUtilsV5,
  UnistNode,
} from "@dendronhq/unified";
import _ from "lodash";
import { runEngineTestV5 } from "../../../engine";
import { ENGINE_HOOKS } from "../../../presets";
import { TestUnifiedUtils } from "../../../utils";
import { createProcForTest, createProcTests, ProcTests } from "./utils";

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

function getExtendedImage(node: UnistNode): ExtendedImage {
  return getDescendantNode<ExtendedImage>(expect, node, 0, 0);
}

describe("extendedImage", () => {
  describe("parse", () => {
    test("with alt", () => {
      const resp = proc().parse(
        `![this is the (alt) text](/assets/image.png){width: 50%}`
      );
      expect(getExtendedImage(resp).type).toEqual(
        DendronASTTypes.EXTENDED_IMAGE
      );
      expect(getExtendedImage(resp).alt).toEqual("this is the (alt) text");
      expect(getExtendedImage(resp).url).toEqual("/assets/image.png");
      expect(getExtendedImage(resp).props?.width).toEqual("50%");
    });

    test("with parenthesis in url", () => {
      const resp = proc().parse(
        `![this is the (alt) text](/assets/image_(file).png){width: 50%}`
      );
      expect(getExtendedImage(resp).type).toEqual(
        DendronASTTypes.EXTENDED_IMAGE
      );
      expect(getExtendedImage(resp).alt).toEqual("this is the (alt) text");
      expect(getExtendedImage(resp).url).toEqual("/assets/image_(file).png");
      expect(getExtendedImage(resp).props?.width).toEqual("50%");
    });

    test("with empty props", () => {
      const resp = proc().parse(
        `![this is the (alt) text](/assets/image.png){}`
      );
      expect(getExtendedImage(resp).type).toEqual(
        DendronASTTypes.EXTENDED_IMAGE
      );
      expect(getExtendedImage(resp).alt).toEqual("this is the (alt) text");
      expect(getExtendedImage(resp).url).toEqual("/assets/image.png");
    });

    test("without alt", () => {
      const resp = proc().parse(`![](/assets/image.png){width: 50%}`);
      expect(getExtendedImage(resp).type).toEqual(
        DendronASTTypes.EXTENDED_IMAGE
      );
      expect(getExtendedImage(resp).url).toEqual("/assets/image.png");
      expect(getExtendedImage(resp).props?.width).toEqual("50%");
    });

    test("doesn't parse inline code block", () => {
      const resp = proc().parse(`\`![](/assets/image.png){width: 50%}\``);
      expect(getExtendedImage(resp).type).toEqual("inlineCode");
    });

    test("doesn't parse regular images", () => {
      // Regular images should skip the extended image parser and use the regular image parser
      const resp = proc().parse(`![](/assets/image.png)`);
      expect(getExtendedImage(resp).type).toEqual(DendronASTTypes.IMAGE);
    });

    test("doesn't parse broken YAML", () => {
      const resp = proc().parse(`![](/assets/image.png){'test}`);
      expect(getExtendedImage(resp).type).toEqual(DendronASTTypes.IMAGE);
    });
  });

  describe("rendering", () => {
    const SINGLE_STYLE_PROP = createProcTests({
      name: "single style prop",
      setupFunc: async ({ engine, vaults, extra, wsRoot }) => {
        const proc2 = await createProcForTest({
          engine,
          dest: extra.dest,
          vault: vaults[0],
          config: DConfig.readConfigSync(wsRoot),
        });
        const resp = await proc2.process(
          `![alt text](/assets/image.png){width: 50%}`
        );
        return { resp };
      },
      verifyFuncDict: {
        [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
          const { resp } = extra;
          expect(resp).toMatchSnapshot();
          return [
            {
              actual: await AssertUtils.assertInString({
                body: resp.toString(),
                match: [`![alt text](/assets/image.png)`],
              }),
              expected: true,
            },
          ];
        },
        [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
          const { resp } = extra;
          expect(resp).toMatchSnapshot();
          return [
            {
              actual: await AssertUtils.assertInString({
                body: resp.toString(),
                match: [`![alt text](/assets/image.png){width: 50%}`],
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
                  `<img src="/assets/image.png" alt="alt text" style="width:50%;">`,
                ],
              }),
              expected: true,
            },
          ];
        },
      },
      preSetupHook: ENGINE_HOOKS.setupBasic,
    });

    const NO_ALT = createProcTests({
      name: "no alt",
      setupFunc: async ({ engine, vaults, extra, wsRoot }) => {
        const proc2 = await createProcForTest({
          engine,
          dest: extra.dest,
          vault: vaults[0],
          config: DConfig.readConfigSync(wsRoot),
        });
        const resp = await proc2.process(`![](/assets/image.png){width: 50%}`);
        return { resp };
      },
      verifyFuncDict: {
        [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
          const { resp } = extra;
          expect(resp).toMatchSnapshot();
          return [
            {
              actual: await AssertUtils.assertInString({
                body: resp.toString(),
                match: [`![](/assets/image.png)`],
              }),
              expected: true,
            },
          ];
        },
        [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
          const { resp } = extra;
          expect(resp).toMatchSnapshot();
          return [
            {
              actual: await AssertUtils.assertInString({
                body: resp.toString(),
                match: [`![](/assets/image.png){width: 50%}`],
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
                match: [`<img src="/assets/image.png" style="width:50%;">`],
              }),
              expected: true,
            },
          ];
        },
      },
      preSetupHook: ENGINE_HOOKS.setupBasic,
    });

    const MULTIPLE_STYLE_PROPS = createProcTests({
      name: "multiple style props",
      setupFunc: async ({ engine, vaults, extra, wsRoot }) => {
        const proc2 = await createProcForTest({
          engine,
          dest: extra.dest,
          vault: vaults[0],
          config: DConfig.readConfigSync(wsRoot),
        });
        const resp = await proc2.process(
          `![alt text](/assets/image.png){width: 50%, max-height: 400px, opacity: 0.8}`
        );
        return { resp };
      },
      verifyFuncDict: {
        [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
          const { resp } = extra;
          expect(resp).toMatchSnapshot();
          return [
            {
              actual: await AssertUtils.assertInString({
                body: resp.toString(),
                match: [`![alt text](/assets/image.png)`],
              }),
              expected: true,
            },
          ];
        },
        [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
          const { resp } = extra;
          expect(resp).toMatchSnapshot();
          return [
            {
              actual: await AssertUtils.assertInString({
                body: resp.toString(),
                match: [
                  `![alt text](/assets/image.png){width: 50%, max-height: 400px, opacity: 0.8}`,
                ],
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
                  `<img src="/assets/image.png" alt="alt text" style="width:50%;max-height:400px;opacity:0.8;">`,
                ],
              }),
              expected: true,
            },
          ];
        },
      },
      preSetupHook: ENGINE_HOOKS.setupBasic,
    });

    const ALL_TEST_CASES = [
      ...SINGLE_STYLE_PROP,
      ...MULTIPLE_STYLE_PROPS,
      ...NO_ALT,
    ];
    runAllTests({ name: "compile", testCases: ALL_TEST_CASES });
  });
});
