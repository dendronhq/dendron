import rehypeStringify from "rehype-stringify";
import remarkRehype from "remark-rehype";
import { DEngineClientV2 } from "../../types";
import { MDUtilsV4 } from "../utils";

function proc(engine: DEngineClientV2) {
  return MDUtilsV4.proc({ engine });
}

function procRehype(engine: DEngineClientV2) {
  return MDUtilsV4.proc({ engine }).use(remarkRehype).use(rehypeStringify);
}
describe("basics", () => {
  let engine: any;

  test("bullet", () => {
    const bulletLine = `- [ ] a bullet`;
    let resp = proc(engine).parse(bulletLine);
    expect(resp).toMatchSnapshot();
    let resp2 = proc(engine).processSync(bulletLine);
    expect(resp2).toMatchSnapshot();
    let resp3 = procRehype(engine).processSync(bulletLine);
    expect(resp3).toMatchSnapshot();
  });
});
