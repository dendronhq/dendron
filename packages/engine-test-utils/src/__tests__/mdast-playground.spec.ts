import { mdastBuilder, MDUtilsV4 } from "@dendronhq/engine-server";
const {
  root,
  paragraph,
  link,
  listItem,
  text,
  heading,
  brk,
  list,
} = mdastBuilder;

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
});
