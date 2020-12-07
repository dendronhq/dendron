import {
  AssertUtils,
  NoteTestUtilsV4,
  runEngineTest,
} from "@dendronhq/common-test-utils";
import _ from "lodash";
import { ParserUtilsV2 } from "../../utilsv2";
import { ReplaceRefOptions, replaceRefs } from "../replaceRefs";
import { createEngine } from "./utils";

const getProc = (opts: ReplaceRefOptions) => {
  return ParserUtilsV2.getRemark().use(replaceRefs, opts);
};

describe("replaceRefs", () => {
  test("imagePrefix", () => {
    const out = getProc({ imageRefPrefix: "bond/", scratch: "" }).processSync(
      `![alt-text](image-url.jpg)`
    );
    expect(_.trim(out.toString())).toEqual("![alt-text](bond/image-url.jpg)");
  });

  describe("basic/", () => {
    let opts: ReplaceRefOptions;

    beforeEach(() => {
      opts = {
        wikiLink2Md: true,
        scratch: "",
      };
    });

    test("mixed", () => {
      const links = `
[link](normal-link)

- [[foo-wiki-link]]
- [[label|foo-wiki-link]]
- [[label|foo-wiki-link]]#foobar
    `;
      const proc = getProc({
        ...opts,
      });
      const out = proc.processSync(links);
      expect(
        AssertUtils.assertInString({
          body: out.toString(),
          match: [
            "[link](normal-link)",
            "- [foo-wiki-link](foo-wiki-link)",
            "- [label](foo-wiki-link)",
            "- [label](foo-wiki-link)#foobar",
          ],
        })
      ).toBeTruthy();
    });

    test("relative", async () => {
      await runEngineTest(
        async ({ engine }) => {
          const proc = getProc({
            ...opts,
            engine,
          });
          const out = proc.processSync("[[alpha#foo]]");
          expect(_.trim(out.toString())).toEqual("[alpha](alpha#foo)");
        },
        {
          createEngine,
        }
      );
    });

    test("use id", async () => {
      await runEngineTest(
        async ({ engine }) => {
          const proc = getProc({
            ...opts,
            wikiLinkUseId: true,
            engine,
          });

          const out = proc.processSync("[[alpha]]");
          expect(_.trim(out.toString())).toEqual("[alpha](alpha-id)");
        },
        {
          createEngine,
          preSetupHook: async ({ vaults, wsRoot }) => {
            await NoteTestUtilsV4.createNote({
              fname: "alpha",
              wsRoot,
              vault: vaults[0],
              props: { id: "alpha-id" },
            });
          },
        }
      );
    });

    test("use id, relative link", async () => {
      await runEngineTest(
        async ({ engine }) => {
          const proc = getProc({
            ...opts,
            wikiLinkUseId: true,
            engine,
          });
          const out = proc.processSync("[[alpha#foo]]");
          expect(_.trim(out.toString())).toEqual("[alpha](alpha-id#foo)");
        },
        {
          createEngine,
          preSetupHook: async ({ vaults, wsRoot }) => {
            await NoteTestUtilsV4.createNote({
              wsRoot,
              fname: "alpha",
              vault: vaults[0],
              props: { id: "alpha-id" },
            });
          },
        }
      );
    });
  });
});
