import { NoteUtils, SchemaUtils } from "@dendronhq/common-all";
import {
  ENGINE_HOOKS,
  NoteTestUtilsV4,
  runEngineTestV4,
  SetupHookFunction,
} from "@dendronhq/common-test-utils";
import { createEngine } from "@dendronhq/engine-server";
import { tmpdir } from "os";
import path from "path";

const preSetupHook: SetupHookFunction = async ({ vaults, wsRoot }) => {
  await NoteTestUtilsV4.createNote({ fname: "foo", vault: vaults[0], wsRoot });
  await NoteTestUtilsV4.createSchema({
    fname: "foo",
    vault: vaults[0],
    wsRoot,
    modifier: (schema) => {
      schema.schemas["ch1"] = SchemaUtils.create({
        id: "ch1",
        vault: vaults[0],
      });
      return schema;
    },
  });
};

describe("note", () => {
  const vault = { fsPath: tmpdir() };

  describe("getNoteByFnameV5", async () => {
    test("basic", async () => {
      await runEngineTestV4(
        async ({ vaults, engine, wsRoot }) => {
          const fname = "foo";
          const resp = NoteUtils.getNoteByFnameV5({
            fname,
            notes: engine.notes,
            vault: vaults[0],
            wsRoot,
          });
          expect(resp).toEqual(engine.notes["foo"]);
          return [];
        },
        {
          expect,
          createEngine,
          preSetupHook: ENGINE_HOOKS.setupBasic,
        }
      );
    });

    test("full path on input", async () => {
      await runEngineTestV4(
        async ({ vaults, engine, wsRoot }) => {
          const fname = "foo";
          const resp = NoteUtils.getNoteByFnameV5({
            fname,
            notes: engine.notes,
            vault: { fsPath: path.join(wsRoot, vaults[0].fsPath) },
            wsRoot,
          });
          expect(resp).toEqual(engine.notes["foo"]);
          return [];
        },
        {
          expect,
          createEngine,
          preSetupHook: ENGINE_HOOKS.setupBasic,
        }
      );
    });

    test("full path on node", async () => {
      await runEngineTestV4(
        async ({ vaults, engine, wsRoot }) => {
          const fname = "foo";
          const resp = NoteUtils.getNoteByFnameV5({
            fname,
            notes: engine.notes,
            vault: { fsPath: path.join(wsRoot, vaults[0].fsPath) },
            wsRoot,
          });
          expect(resp).toEqual(engine.notes["foo"]);
          return [];
        },
        {
          expect,
          createEngine,
          preSetupHook: ENGINE_HOOKS.setupBasic,
        }
      );
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

    test("with hierarchy", () => {
      const note = NoteUtils.create({
        id: "foo",
        fname: "foo",
        created: 1,
        updated: 1,
        children: ["ch1", "ch2"],
        parent: "root",
        vault,
      });
      const serialized = NoteUtils.serialize(note, { writeHierarchy: true });
      expect(serialized).toMatchSnapshot();
      expect(serialized.match(/^parent: root/gm)).toBeTruthy();
      expect(serialized.match(/ch1/gm)).toBeTruthy();
      expect(serialized.match(/ch2/gm)).toBeTruthy();
    });

    test("with hierarchy and null parent", () => {
      const note = NoteUtils.create({
        id: "foo",
        fname: "foo",
        created: 1,
        updated: 1,
        children: ["ch1", "ch2"],
        parent: null,
        vault,
      });
      const serialized = NoteUtils.serialize(note, { writeHierarchy: true });
      expect(serialized).toMatchSnapshot();
      expect(serialized.match(/^parent: null/gm)).toBeTruthy();
      expect(serialized.match(/ch1/gm)).toBeTruthy();
      expect(serialized.match(/ch2/gm)).toBeTruthy();
    });
  });
});

describe("matchPath", () => {
  it("match path on domain, reg", async () => {
    await runEngineTestV4(
      async ({ engine }) => {
        const resp = SchemaUtils.matchPath({
          notePath: "foo",
          schemaModDict: engine.schemas,
        });
        expect(resp?.schema.id).toEqual("foo");
        return [];
      },
      { createEngine, preSetupHook, expect }
    );
  });

  it("match path on domain as namespace", async () => {
    await runEngineTestV4(
      async ({ engine }) => {
        const resp = SchemaUtils.matchPath({
          notePath: "bond",
          schemaModDict: engine.schemas,
        });
        expect(resp?.schema.id).toEqual("bond");
        expect(resp?.namespace).toBeTruthy();
        return [];
      },
      {
        expect,
        createEngine,
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
    await runEngineTestV4(
      async ({ engine }) => {
        const resp = SchemaUtils.matchPath({
          notePath: "bond.foo",
          schemaModDict: engine.schemas,
        });
        expect(resp?.schema.id).toEqual("bond");
        expect(resp?.namespace).toBeFalsy();
        return [];
      },
      {
        expect,
        createEngine,
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
    await runEngineTestV4(
      async ({ engine }) => {
        const schema = engine.notes["foo"].schema;
        expect(schema).toEqual({ moduleId: "foo", schemaId: "foo" });
        return [];
      },
      {
        expect,
        createEngine,
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
    await runEngineTestV4(
      async ({ engine }) => {
        const schema = engine.notes["bond"].schema;
        expect(schema).toEqual({ moduleId: "bond", schemaId: "bond" });
        return [];
      },
      {
        expect,
        createEngine,
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
    await runEngineTestV4(
      async ({ engine }) => {
        const schema = engine.notes["bond.ch1"].schema;
        expect(schema).toEqual({ moduleId: "bond", schemaId: "bond" });
        return [];
      },
      {
        expect,
        createEngine,
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
