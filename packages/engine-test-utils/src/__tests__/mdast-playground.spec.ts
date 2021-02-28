import {
  DendronASTDest,
  mdastBuilder,
  MDUtilsV4,
} from "@dendronhq/engine-server";
import { testWithEngine } from "../engine";
const { root, paragraph, link, listItem, text, heading, list } = mdastBuilder;

describe("proto", () => {
  test("basic", () => {
    const proc = MDUtilsV4.remark();

    const output = proc.stringify(
      root([
        heading(2, text("Begin")),
        paragraph([
          list("unordered", [
            paragraph(link("dendron.so", undefined, text("bullet link"))),
            listItem(text("one")),
            listItem(text("two")),
            listItem(text("three")),
          ]),
        ]),
      ])
    );
    expect(output).toMatchSnapshot();
  });

  test("basic2", async () => {
    const proc = MDUtilsV4.remark();

    const output = await proc.parse(["line one", "***", "line two"].join("\n"));
    expect(output).toMatchSnapshot();
  });

  testWithEngine("wiilinks as list", async ({ engine, vaults }) => {
    const proc = MDUtilsV4.procFull({
      dest: DendronASTDest.MD_DENDRON,
      engine,
      fname: "foo",
      vault: vaults[0],
    });
    const output = await proc.parse(["- [[one]]", "- [[two]]"].join("\n"));
    expect(output).toMatchSnapshot();
  });
});
