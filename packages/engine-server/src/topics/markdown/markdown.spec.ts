import { tokens2MD, md2Tokens, md } from "./utils";
import { MDRenderer } from "./renderer";

const mdSimple = `
## Header

Content
- bullet
1. number
`;

describe.skip("Tokens2Md", () => {
  test("identity", () => {
    const tokens = md2Tokens(mdSimple);
    // expect(new MDRenderer().renderInline(tokens, {}, {})).toMatchSnapshot("inline");

    expect(md().render(mdSimple)).toMatchSnapshot("normal");
    expect(tokens2MD(tokens)).toMatchSnapshot("bond");
    //expect(tokens2MD(ast)).toEqual(mdSimple);
    // expect(mdNodes2MD(mdSimple)).toEqual(mdSimple);
  });
});
