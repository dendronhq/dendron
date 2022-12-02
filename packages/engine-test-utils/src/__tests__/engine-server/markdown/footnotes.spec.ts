import { ConfigService, URI } from "@dendronhq/common-all";
import {
  AssertUtils,
  NoteTestUtilsV4,
  TestPresetEntryV4,
} from "@dendronhq/common-test-utils";
import { DendronASTDest } from "@dendronhq/unified";
import { runEngineTestV5 } from "../../../engine";
import { ENGINE_HOOKS } from "../../../presets";
import { createProcForTest, createProcTests } from "./utils";

describe("footnotes", () => {
  const BASIC = createProcTests({
    name: "basic",
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
        [
          "Fugit et dolores velit dicta officiis.",
          "Architecto saepe repudiandae sunt sed labore. [^1]",
          "",
          "[^1]: nesciunt ullam quos",
          "",
          "Et maiores magnam mollitia [^magni] quas porro tenetur.",
          "",
          "[^magni]: Culpa repellat voluptatem magni.",
        ].join("\n")
      );
      return { resp };
    },
    verifyFuncDict: {
      [DendronASTDest.HTML]: async ({ extra }) => {
        const { resp } = extra;
        expect(resp).toMatchSnapshot();
        return [
          {
            actual: await AssertUtils.assertInString({
              body: resp.toString(),
              match: [
                "Footnotes",
                "nesciunt ullam quos",
                "Culpa repellat voluptatem magni.",
              ],
            }),
            expected: true,
          },
        ];
      },
    },
    preSetupHook: ENGINE_HOOKS.setupBasic,
  });

  const UNUSED = createProcTests({
    name: "unused footnote",
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
        [
          "Fugit et dolores velit dicta officiis.",
          "Architecto saepe repudiandae sunt sed labore. [^1]",
          "",
          "[^1]: nesciunt ullam quos",
          "",
          "Et maiores magnam mollitia quas porro tenetur.",
          "",
          "[^magni]: Culpa repellat voluptatem magni.",
        ].join("\n")
      );
      return { resp };
    },
    verifyFuncDict: {
      [DendronASTDest.HTML]: async ({ extra }) => {
        const { resp } = extra;
        expect(resp).toMatchSnapshot();
        return [
          {
            actual: await AssertUtils.assertInString({
              body: resp.toString(),
              match: ["Footnotes", "nesciunt ullam quos"],
              nomatch: ["Culpa repellat voluptatem magni."],
            }),
            expected: true,
          },
        ];
      },
    },
    preSetupHook: ENGINE_HOOKS.setupBasic,
  });

  const WITH_LINK = createProcTests({
    name: "footnote containing link",
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
        [
          "Fugit et dolores velit dicta officiis.",
          "Architecto saepe repudiandae sunt sed labore. [^1]",
          "",
          "[^1]: nesciunt ullam [quos](http://example.com)",
          "",
          "Et maiores magnam [^magni] mollitia quas porro tenetur.",
          "",
          "[^magni]: Culpa repellat voluptatem magni.",
        ].join("\n")
      );
      return { resp };
    },
    verifyFuncDict: {
      [DendronASTDest.HTML]: async ({ extra }) => {
        const { resp } = extra;
        expect(resp).toMatchSnapshot();
        return [
          {
            actual: await AssertUtils.assertInString({
              body: resp.toString(),
              match: [
                "Footnotes",
                "nesciunt ullam",
                "quos",
                "http://example.com",
                "Culpa repellat voluptatem magni.",
              ],
              nomatch: [],
            }),
            expected: true,
          },
        ];
      },
    },
    preSetupHook: ENGINE_HOOKS.setupBasic,
  });

  const NESTED = createProcTests({
    name: "note with reference, with both note and reference containing footnotes",
    preSetupHook: async (opts) => {
      const { wsRoot, vaults } = opts;
      await ENGINE_HOOKS.setupBasic(opts);
      await NoteTestUtilsV4.createNote({
        fname: "target",
        wsRoot,
        vault: vaults[0],
        body: [
          "Odio delectus veniam qui molestiae tenetur. [^1]",
          "Ipsum iusto impedit provident. [^vel]",
          "",
          "[^vel]: Vel omnis deleniti omnis.",
          "[^1]: Animi eius nesciunt.",
        ].join("\n"),
      });
    },
    setupFunc: async ({ engine, vaults, extra, wsRoot }) => {
      const target = await NoteTestUtilsV4.createNote({
        fname: "target",
        wsRoot,
        vault: vaults[0],
        body: [
          "Odio delectus veniam qui molestiae tenetur. [^1]",
          "Ipsum iusto impedit provident. [^vel]",
          "",
          "[^vel]: Vel omnis deleniti omnis.",
          "[^1]: Animi eius nesciunt.",
        ].join("\n"),
      });

      const config = (
        await ConfigService.instance().readConfig(URI.file(wsRoot))
      )._unsafeUnwrap();
      const proc2 = await createProcForTest({
        engine,
        dest: extra.dest,
        vault: vaults[0],
        config,
        parsingDependenciesByNoteProps: [target],
      });
      const resp = await proc2.process(
        [
          "Fugit et dolores velit dicta officiis.",
          "Architecto saepe repudiandae sunt sed labore. [^1]",
          "",
          "[^1]: nesciunt ullam quos",
          "",
          "![[target]]",
          "",
          "Et maiores magnam [^magni] mollitia quas porro tenetur.",
          "",
          "[^magni]: Culpa repellat voluptatem magni.",
        ].join("\n")
      );
      return { resp };
    },
    verifyFuncDict: {
      [DendronASTDest.HTML]: async ({ extra }) => {
        const { resp } = extra;
        expect(resp).toMatchSnapshot();
        return [
          {
            actual: await AssertUtils.assertInString({
              body: resp.toString(),
              match: [
                "Footnotes",
                "nesciunt ullam quos",
                "Culpa repellat voluptatem magni.",
                "Vel omnis deleniti omnis",
                "Animi eius nesciunt",
              ],
            }),
            expected: true,
          },
        ];
      },
    },
  });

  const ALL_TEST_CASES = [...BASIC, ...UNUSED, ...WITH_LINK, ...NESTED];

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
