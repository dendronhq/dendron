import { NoteTestUtilsV4, runEngineTestV4 } from "@dendronhq/common-test-utils";
import _ from "lodash";
import { DendronASTDest } from "../../types";
import { MDUtilsV4 } from "../../utils";
import { RemarkUtils } from "../utils";
import { createEngine } from "./utils";

describe("h1ToTitle", () => {
  test("basic", async () => {
    await runEngineTestV4(
      async ({ engine }) => {
        const proc = MDUtilsV4.procFull({
          dest: DendronASTDest.MD_REGULAR,
          engine,
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
        createEngine,
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
