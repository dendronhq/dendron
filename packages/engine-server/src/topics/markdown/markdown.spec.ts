import { mdNodes2MD, md2MDNodes } from "./utils";

const mdSimple = `
# Header

Content
`;

describe("Tokens2Md", () => {
  test("identity", () => {
    const ast = md2MDNodes(mdSimple);
    // expect(mdNodes2MD(ast)).toEqual(mdSimple);
    expect(mdNodes2MD(mdSimple)).toEqual(mdSimple);
  });
});
