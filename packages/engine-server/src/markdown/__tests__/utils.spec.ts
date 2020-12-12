import { DEngineClientV2 } from "@dendronhq/common-all";
import { MDUtilsV4 } from "../../utils";
import { wikiLinks, WikiLinksOpts } from "../wikiLinks";

function proc(engine: DEngineClientV2, opts?: WikiLinksOpts) {
  return MDUtilsV4.proc({ engine }).use(wikiLinks, opts);
}

describe("basic", () => {
  test("wiki link conversion", () => {});
});
