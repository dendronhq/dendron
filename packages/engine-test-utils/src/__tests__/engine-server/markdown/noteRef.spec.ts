import { DEngineClient } from "@dendronhq/common-all";
import { ENGINE_HOOKS } from "@dendronhq/common-test-utils";
import {
  DendronASTData,
  DendronASTDest,
  dendronPub,
  MDUtilsV4,
  noteRefs,
  NoteRefsOpts,
} from "@dendronhq/engine-server";
import { runEngineTestV5 } from "../../../engine";
import { genDendronData } from "./utils";

function proc(
  engine: DEngineClient,
  dendron: DendronASTData,
  opts?: NoteRefsOpts
) {
  return MDUtilsV4.proc({ engine })
    .data("dendron", dendron)
    .use(noteRefs, opts);
}

describe("parse", () => {
  let engine: any;
  let dest: DendronASTDest.MD_REGULAR;

  test("init", () => {
    const resp = proc(engine, genDendronData({ dest })).parse(
      `((ref: [[foo.md]]))`
    );
    expect(resp).toMatchSnapshot();
    // @ts-ignore
    expect(resp.children[0].children[0].type).toEqual("refLink");
  });

  test("init with inject", async () => {
    await runEngineTestV5(
      async ({ engine, vaults }) => {
        let _proc = proc(
          engine,
          genDendronData({ dest, vault: vaults[0] })
        ).use(dendronPub);
        const resp = _proc.parse(`((ref: [[foo.md]]))`);
        expect(resp).toMatchSnapshot();
        const resp2 = _proc.runSync(resp);
        expect(resp2).toMatchSnapshot();
        return;
      },
      {
        expect,
        preSetupHook: ENGINE_HOOKS.setupBasic,
      }
    );
  });

  test("doesn't parse inline code block", () => {
    const resp = proc(engine, genDendronData({ dest })).parse(
      "`((ref: [[foo.md]]))`"
    );
    expect(resp).toMatchSnapshot("bond");
    // @ts-ignore
    expect(resp.children[0].children[0].type).toEqual("inlineCode");
  });
});
