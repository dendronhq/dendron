import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import {
  DendronASTDest,
  DEngineClientV2,
  MDUtilsV4,
  RemarkUtils,
} from "@dendronhq/engine-server";
import _ from "lodash";
import { DVault, runEngineTestV5, testWithEngine } from "../../../engine";
import { checkString } from "../../../utils";

describe("h1ToTitle", () => {
  test("basic", async () => {
    await runEngineTestV5(
      async ({ engine, vaults }) => {
        const proc = MDUtilsV4.procFull({
          dest: DendronASTDest.MD_REGULAR,
          engine,
          fname: "foo",
          vault: vaults[0],
        });
        await Promise.all(
          _.values(engine.notes).map(async (note) => {
            const newBody = await proc()
              .use(RemarkUtils.h1ToTitle(note, []))
              .process(note.body);
            note.body = newBody.toString();
            return note;
          })
        );
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

describe("convert old note ref", () => {
  const setup = async (opts: { engine: DEngineClientV2; vaults: DVault[] }) => {
    const { engine, vaults } = opts;
    const config = { ...engine.config, noLegacyNoteRef: false };
    const proc = MDUtilsV4.procFull({
      dest: DendronASTDest.MD_DENDRON,
      engine,
      config,
      fname: "foo",
      vault: vaults[0],
    });
    const note = engine.notes["foo"];
    const newBody = await proc()
      .use(RemarkUtils.oldNoteRef2NewNoteRef(note, []))
      .process(note.body);
    note.body = newBody.toString();
    return note;
  };

  testWithEngine(
    "basic",
    async ({ engine, vaults }) => {
      const note = await setup({ engine, vaults });
      await checkString(note.body, "![[bar]]");
    },
    {
      preSetupHook: async ({ wsRoot, vaults }) => {
        //const txt = `# Hello Heading\nHello Content`;
        await NoteTestUtilsV4.createNote({
          wsRoot,
          vault: vaults[0],
          fname: "foo",
          body: ["((ref: [[bar]]))"].join("\n"),
        });
      },
    }
  );

  testWithEngine(
    "nested",
    async ({ engine, vaults }) => {
      const note = await setup({ engine, vaults });
      await checkString(note.body, "![[bar]]");
    },
    {
      preSetupHook: async ({ wsRoot, vaults }) => {
        await NoteTestUtilsV4.createNote({
          wsRoot,
          vault: vaults[0],
          fname: "foo",
          body: ["# Header1", "Blah blah", "((ref: [[bar]]))"].join("\n"),
        });
      },
    }
  );

  testWithEngine(
    "multiple",
    async ({ engine, vaults }) => {
      const note = await setup({ engine, vaults });
      await checkString(note.body, "![[bar]]");
      await checkString(note.body, "![[gamma]]");
    },
    {
      preSetupHook: async ({ wsRoot, vaults }) => {
        await NoteTestUtilsV4.createNote({
          wsRoot,
          vault: vaults[0],
          fname: "foo",
          body: [
            "# Header1",
            "Blah blah",
            "((ref: [[bar]]))",
            "((ref: [[gamma]]))",
          ].join("\n"),
        });
      },
    }
  );

  testWithEngine(
    "with header",
    async ({ engine, vaults }) => {
      const note = await setup({ engine, vaults });
      await checkString(note.body, "![[bar#foo]]");
    },
    {
      preSetupHook: async ({ wsRoot, vaults }) => {
        await NoteTestUtilsV4.createNote({
          wsRoot,
          vault: vaults[0],
          fname: "foo",
          body: ["((ref: [[bar]]#foo))"].join("\n"),
        });
      },
    }
  );

  testWithEngine(
    "with header and offset",
    async ({ engine, vaults }) => {
      const note = await setup({ engine, vaults });
      await checkString(note.body, "![[bar#foo,1]]");
    },
    {
      preSetupHook: async ({ wsRoot, vaults }) => {
        await NoteTestUtilsV4.createNote({
          wsRoot,
          vault: vaults[0],
          fname: "foo",
          body: ["((ref: [[bar]]#foo,1))"].join("\n"),
        });
      },
    }
  );

  testWithEngine(
    "with header and offset and range",
    async ({ engine, vaults }) => {
      const note = await setup({ engine, vaults });
      await checkString(note.body, "![[bar#foo,1:#gamma]]");
    },
    {
      preSetupHook: async ({ wsRoot, vaults }) => {
        await NoteTestUtilsV4.createNote({
          wsRoot,
          vault: vaults[0],
          fname: "foo",
          body: ["((ref: [[bar]]#foo,1:#gamma))"].join("\n"),
        });
      },
    }
  );

  testWithEngine(
    "with header with space",
    async ({ engine, vaults }) => {
      const note = await setup({ engine, vaults });
      await checkString(note.body, "![[bar#foo-bar]]");
    },
    {
      preSetupHook: async ({ wsRoot, vaults }) => {
        await NoteTestUtilsV4.createNote({
          wsRoot,
          vault: vaults[0],
          fname: "foo",
          body: ["((ref: [[bar]]#foo bar))"].join("\n"),
        });
      },
    }
  );
});
