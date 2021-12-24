import { DEngineClient, DLink } from "@dendronhq/common-all";
import {
  NoteTestUtilsV4,
  SetupHookFunction,
} from "@dendronhq/common-test-utils";
import { runEngineTestV5 } from "../../engine";
import { ENGINE_HOOKS } from "../../presets";
import { NoteMetadataUtils } from "@dendronhq/engine-server";

describe("NoteMetadataUtils", () => {
  const preSetupHook = ENGINE_HOOKS.setupBasic;
  const getNote = (engine: DEngineClient) => {
    return engine.notes["foo"];
  };

  describe("when extracting string", () => {
    test("THEN get string", async () => {
      await runEngineTestV5(
        async ({ engine }) => {
          const note = getNote(engine);
          expect(
            NoteMetadataUtils.extractString({
              note,
              key: "title",
            })
          ).toEqual("Foo");
        },
        { expect, preSetupHook }
      );
    });
  });

  describe("when extracting date", () => {
    const preSetupHook = ENGINE_HOOKS.setupBasic;
    const getNote = (engine: DEngineClient) => {
      return engine.notes["foo"];
    };
    test("THEN get date", async () => {
      await runEngineTestV5(
        async ({ engine }) => {
          const note = getNote(engine);
          expect(
            NoteMetadataUtils.extractDate({
              note,
              key: "created",
            })
          ).toEqual("December 31, 1969, 4:00 PM PST");
        },
        { expect, preSetupHook }
      );
    });
  });

  describe("WHEN extracting links", () => {
    const preSetupHook: SetupHookFunction = async ({ wsRoot, vaults }) => {
      const vault = vaults[0];
      await NoteTestUtilsV4.createNote({
        fname: "foo",
        body: "#alpha\n#beta\n[[gamma]]\n[[delta]]\n",
        vault,
        wsRoot,
      });
      return;
    };

    const getNote = (engine: DEngineClient) => {
      return engine.notes["foo"];
    };
    describe("AND WHEN extract single link", async () => {
      let links: DLink[];
      beforeAll(async () => {
        await runEngineTestV5(
          async ({ engine }) => {
            const note = getNote(engine);
            links = NoteMetadataUtils.extractLinks({
              note,
              filters: ["gamma"],
            });
          },
          { expect, preSetupHook }
        );
      });
      test("THEN extract one link", () => {
        expect(links.length).toEqual(1);
      });
      test("THEN link is equal to filter", () => {
        expect(links[0]).toMatchObject({
          alias: "gamma",
          from: { fname: "foo", id: "foo", vaultName: "vault1" },
          position: {
            end: { column: 10, line: 3, offset: 22 },
            indent: [],
            start: { column: 1, line: 3, offset: 13 },
          },
          sameFile: false,
          to: {
            anchorHeader: undefined,
            fname: "gamma",
            vaultName: undefined,
          },
          type: "wiki",
          value: "gamma",
          xvault: false,
        });
      });
    });
  });
});
