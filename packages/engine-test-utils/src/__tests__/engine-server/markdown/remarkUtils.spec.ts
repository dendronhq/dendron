import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import {
  DendronASTDest,
  MDUtilsV4,
  RemarkUtils,
} from "@dendronhq/engine-server";
import _ from "lodash";
import { runEngineTestV5 } from "../../../engine";
// import { DendronASTDest } from "../../types";
// import { MDUtilsV4 } from "../../utils";
// import { RemarkUtils } from "../utils";
// import { createEngine } from "./utils";

describe("h1ToTitle", () => {
  test("basic", async () => {
    await runEngineTestV5(
      async ({ engine }) => {
        const proc = MDUtilsV4.procFull({
          dest: DendronASTDest.MD_REGULAR,
          engine,
          fname: "",
          vault: {} as any,
        });
        // @ts-ignore
        const notes = await Promise.all(
          _.values(engine.notes).map(async (note) => {
            const newBody = await proc()
              .use(RemarkUtils.h1ToTitle(note, []))
              .process(note.body);
            note.body = newBody.toString();
            return note;
          })
        );
        // TODO
        // expect(notes).toMatchSnapshot();
      },
      {
        expect,
        preSetupHook: async ({ wsRoot, vaults }) => {
          //const txt = `# Hello Heading\nHello Content`;
          await NoteTestUtilsV4.createNote({
            wsRoot,
            vault: vaults[0],
            fname: "foo",
            body: [`# Foo Header`, `## Foo Content`].join("\n"),
          });
          await NoteTestUtilsV4.createNote({
            wsRoot,
            vault: vaults[0],
            fname: "bar",
            body: [`# Bar Header`, `## Bar Content`].join("\n"),
          });
        },
      }
    );
  });
});
