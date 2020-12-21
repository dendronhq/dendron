import { DEngineClientV2 } from "@dendronhq/common-all";
import _ from "lodash";
import { DendronASTData, DendronASTDest } from "../../types";
import { MDUtilsV4 } from "../../utils";
import { dendronPub, DendronPubOpts } from "../dendronPub";

function proc(
  engine: DEngineClientV2,
  dendron: DendronASTData,
  opts?: DendronPubOpts
) {
  return MDUtilsV4.proc({ engine })
    .data("dendron", dendron)
    .use(dendronPub, opts);
}

describe("basics", () => {
  let engine: any;
  let dendronData = { dest: DendronASTDest.HTML };
  test("imagePrefix", () => {
    const out = proc(engine, dendronData, {
      assetsPrefix: "bond/",
    }).processSync(`![alt-text](image-url.jpg)`);
    expect(_.trim(out.toString())).toEqual("![alt-text](bond/image-url.jpg)");
  });
});
