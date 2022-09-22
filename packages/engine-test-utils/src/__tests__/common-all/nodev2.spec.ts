import { NoteUtils, SchemaUtils } from "@dendronhq/common-all";
import {
  NoteTestUtilsV4,
  SetupHookFunction,
} from "@dendronhq/common-test-utils";
import { tmpdir } from "os";
import { runEngineTestV5 } from "../../engine";

const preSetupHook: SetupHookFunction = async ({ vaults, wsRoot }) => {
  await NoteTestUtilsV4.createNote({ fname: "foo", vault: vaults[0], wsRoot });
  await NoteTestUtilsV4.createSchema({
    fname: "foo",
    vault: vaults[0],
    wsRoot,
    modifier: (schema) => {
      schema.schemas["ch1"] = SchemaUtils.createFromSchemaRaw({
        id: "ch1",
        vault: vaults[0],
      });
      return schema;
    },
  });
};

describe("NoteUtils", () => {
  const vault = { fsPath: tmpdir() };

  describe("match", () => {
    test("exact", () => {
      expect(NoteUtils.match({ notePath: "foo", pattern: "foo" })).toBeTruthy();
    });

    test("*", () => {
      expect(NoteUtils.match({ notePath: "foo", pattern: "*" })).toBeTruthy();
    });

    test("partial", () => {
      expect(NoteUtils.match({ notePath: "foo", pattern: "fo*" })).toBeTruthy();
    });

    test("with dot", () => {
      expect(
        NoteUtils.match({ notePath: "foo.one", pattern: "foo.*" })
      ).toBeTruthy();
    });
  });

  describe("serialize", () => {
    test("basic", () => {
      const note = NoteUtils.create({
        id: "foo",
        fname: "foo",
        created: 1,
        updated: 1,
        vault,
      });
      const serialized = NoteUtils.serialize(note);
      expect(serialized).toMatchSnapshot();
      expect(serialized.indexOf("stub") >= 0).toBeFalsy();
    });

    test("with children", () => {
      const note = NoteUtils.create({
        id: "foo",
        fname: "foo",
        created: 1,
        updated: 1,
        children: ["ch1", "ch2"],
        vault,
      });
      const serialized = NoteUtils.serialize(note);
      expect(serialized).toMatchSnapshot();
    });

    test("with parent", () => {
      const note = NoteUtils.create({
        id: "foo",
        fname: "foo",
        created: 1,
        updated: 1,
        parent: "root",
        vault,
      });
      const serialized = NoteUtils.serialize(note);
      expect(serialized).toMatchSnapshot();
    });

    test("with custom", () => {
      const note = NoteUtils.create({
        id: "foo",
        fname: "foo",
        created: 1,
        updated: 1,
        custom: {
          bond: 42,
        },
        vault,
      });
      const serialized = NoteUtils.serialize(note);
      expect(serialized).toMatchSnapshot();
      // should be at beginning of line
      expect(serialized.match(/^bond/gm)).toBeTruthy();
    });
  });
});

describe("matchPath", () => {
  it("match path on domain, reg", async () => {
    await runEngineTestV5(
      async ({ engine }) => {
        const resp = await SchemaUtils.matchPath({
          notePath: "foo",
          engine,
        });
        expect(resp?.schema.id).toEqual("foo");
        return [];
      },
      { preSetupHook, expect }
    );
  });

  it("match path on domain as namespace", async () => {
    await runEngineTestV5(
      async ({ engine }) => {
        const resp = await SchemaUtils.matchPath({
          notePath: "bond",
          engine,
        });
        expect(resp?.schema.id).toEqual("bond");
        expect(resp?.namespace).toBeTruthy();
        return [];
      },
      {
        expect,
        preSetupHook: async ({ vaults, wsRoot }) => {
          await NoteTestUtilsV4.createSchema({
            fname: "bond",
            vault: vaults[0],
            wsRoot,
            modifier: (schema) => {
              schema.schemas[schema.root.id].data.namespace = true;
              return schema;
            },
          });
        },
      }
    );
  });

  it("match path on domain as namespace, child", async () => {
    await runEngineTestV5(
      async ({ engine }) => {
        const resp = await SchemaUtils.matchPath({
          notePath: "bond.foo",
          engine,
        });
        expect(resp?.schema.id).toEqual("bond");
        expect(resp?.namespace).toBeFalsy();
        return [];
      },
      {
        expect,
        preSetupHook: async ({ vaults, wsRoot }) => {
          await NoteTestUtilsV4.createSchema({
            fname: "bond",
            vault: vaults[0],
            wsRoot,
            modifier: (schema) => {
              schema.schemas[schema.root.id].data.namespace = true;
              return schema;
            },
          });
        },
      }
    );
  });
});

describe("matchDomain", () => {
  it("match path on domain, reg", async () => {
    await runEngineTestV5(
      async ({ engine }) => {
        const schema = (await engine.getNote("foo")).data!.schema;
        expect(schema).toEqual({ moduleId: "foo", schemaId: "foo" });
        return [];
      },
      {
        expect,
        preSetupHook: async ({ vaults, wsRoot }) => {
          await NoteTestUtilsV4.createNote({
            fname: "foo",
            vault: vaults[0],
            wsRoot,
          });
          await NoteTestUtilsV4.createSchema({
            fname: "foo",
            vault: vaults[0],
            wsRoot,
          });
        },
      }
    );
  });

  it("match path on domain as namespace", async () => {
    await runEngineTestV5(
      async ({ engine }) => {
        const schema = (await engine.getNote("bond")).data!.schema;
        expect(schema).toEqual({ moduleId: "bond", schemaId: "bond" });
        return [];
      },
      {
        expect,
        preSetupHook: async ({ vaults, wsRoot }) => {
          await NoteTestUtilsV4.createNote({
            fname: "bond",
            vault: vaults[0],
            wsRoot,
          });
          await NoteTestUtilsV4.createSchema({
            fname: "bond",
            vault: vaults[0],
            wsRoot,
            modifier: (schema) => {
              schema.schemas[schema.root.id].data.namespace = true;
              return schema;
            },
          });
        },
      }
    );
  });

  it("match path on domain as namespace", async () => {
    await runEngineTestV5(
      async ({ engine }) => {
        const schema = (await engine.getNote("bond.ch1")).data!.schema;
        expect(schema).toEqual({ moduleId: "bond", schemaId: "bond" });
        return [];
      },
      {
        expect,
        preSetupHook: async ({ vaults, wsRoot }) => {
          await NoteTestUtilsV4.createNote({
            fname: "bond.ch1",
            vault: vaults[0],
            wsRoot,
          });
          await NoteTestUtilsV4.createSchema({
            fname: "bond",
            vault: vaults[0],
            wsRoot,
            modifier: (schema) => {
              schema.schemas[schema.root.id].data.namespace = true;
              return schema;
            },
          });
        },
      }
    );
  });
});
