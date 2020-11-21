import {
  AssertUtils,
  NoteTestUtilsV3,
  runEngineTest,
} from "@dendronhq/common-test-utils";
import _ from "lodash";
import { DendronEngineV2 } from "../../../../enginev2";
import { ParserUtilsV2 } from "../../utilsv2";
import { ReplaceRefOptions, replaceRefs } from "../replaceRefs";

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

  test("wiki2Md", () => {
    const links = `
[link](normal-link)

- [[foo-wiki-link]]
- [[label|foo-wiki-link]]
- [[label|foo-wiki-link]]#foobar
    `;
    const proc = getProc({
      wikiLink2Md: true,
      scratch: "",
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

  test("wiki2Md and swap id", async () => {
    await runEngineTest(
      async ({ engine }) => {
        const proc = getProc({
          wikiLink2Md: true,
          wikiLinkUseId: true,
          scratch: "",
          engine,
        });
        const out = proc.processSync("[[alpha]]");
        expect(_.trim(out.toString())).toEqual("[alpha](alpha-id)");
      },
      {
        createEngine: ({ vaults }) => {
          return DendronEngineV2.createV3({ vaults });
        },
        preSetupHook: async ({ vaults }) => {
          await NoteTestUtilsV3.createNote({
            fname: "alpha",
            vault: vaults[0],
            props: { id: "alpha-id" },
          });
        },
      }
    );
  });
});
