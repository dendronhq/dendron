import {
  DNodeUtilsV2 as _du,
  SchemaUtilsV2 as _su,
} from "@dendronhq/common-all";
import fs from "fs-extra";
import path from "path";
import { tmpDir } from "../files";
import { schemaModuleProps2File } from "../filesv2";

describe("schemaModuleProps2File", () => {
  let root: string;

  beforeEach(() => {
    root = tmpDir().name;
  });

  it("root", async () => {
    const fname = "root";
    const sm = _su.createRootModuleProps(fname);
    await schemaModuleProps2File(sm, root, fname);
    const payload = fs.readFileSync(path.join(root, `${fname}.schema.yml`), {
      encoding: "utf8",
    });
    expect(payload).toMatchSnapshot();
  });

  it("non-root", async () => {
    const fname = "bond";
    const smp = _su.createModuleProps({ fname });
    const rootNote = smp.schemas["root"];
    const ch1 = _su.create({ id: "ch1", fname });
    smp.schemas["ch1"] = ch1;
    _du.addChild(rootNote, ch1);

    await schemaModuleProps2File(smp, root, fname);
    const payload = fs.readFileSync(path.join(root, `${fname}.schema.yml`), {
      encoding: "utf8",
    });
    expect(payload).toMatchSnapshot();
  });
});
