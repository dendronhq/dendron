import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { ParserUtilsV2 } from "@dendronhq/engine-server";
import _ from "lodash";
import { runEngineTestV5, testWithEngine } from "../../../engine";

describe("parserUtils", () => {
  describe("findHeaders", async () => {
    test("one header", async () => {
      await runEngineTestV5(
        async ({ engine }) => {
          const body = engine.notes["foo"].body;
          const out = ParserUtilsV2.findHeaders(body);
          expect(out).toMatchSnapshot("bond");
          expect(_.size(out)).toEqual(1);
          expect(out[0].depth).toEqual(1);
        },
        {
          preSetupHook: async ({ vaults, wsRoot }) => {
            await NoteTestUtilsV4.createNote({
              fname: "foo",
              body: "# h1",
              vault: vaults[0],
              wsRoot,
            });
          },
          expect,
        }
      );
    });
  });

  describe("findLinks", async () => {
    testWithEngine(
      "one link",
      async ({ engine }) => {
        const note = engine.notes["foo"];
        const links = ParserUtilsV2.findLinks({ note, engine });
        expect(links).toMatchSnapshot("bond");
        expect(links[0].to?.fname).toEqual("bar");
      },
      {
        preSetupHook: async ({ wsRoot, vaults }) => {
          await NoteTestUtilsV4.createNote({
            fname: "foo",
            body: "[[bar]]",
            vault: vaults[0],
            wsRoot,
          });
        },
      }
    );

    testWithEngine(
      "empty link",
      async ({ engine }) => {
        const note = engine.notes["foo"];
        const links = ParserUtilsV2.findLinks({ note, engine });
        expect(links).toMatchSnapshot();
        expect(_.isEmpty(links)).toBeTruthy();
      },
      {
        preSetupHook: async ({ wsRoot, vaults }) => {
          await NoteTestUtilsV4.createNote({
            fname: "foo",
            body: "[[]]",
            vault: vaults[0],
            wsRoot,
          });
        },
      }
    );

    testWithEngine(
      "xvault link",
      async ({ engine }) => {
        const note = engine.notes["foo"];
        const links = ParserUtilsV2.findLinks({ note, engine });
        expect(links).toMatchSnapshot();
        expect(links[0].from).toEqual({
          fname: "foo",
          id: "foo",
          vault: {
            fsPath: "vault1",
          },
        });
        expect(links[0].to).toEqual({
          fname: "bar",
          vault: {
            fsPath: "vault2",
          },
        });
      },
      {
        preSetupHook: async ({ wsRoot, vaults }) => {
          await NoteTestUtilsV4.createNote({
            fname: "foo",
            body: "[[dendron://vault2/bar]]",
            vault: vaults[0],
            wsRoot,
          });
        },
      }
    );
  });
});
