import { WorkspaceOpts } from "@dendronhq/common-all";
import { createLogger } from "@dendronhq/common-server";
import {
  ENGINE_CONFIG_PRESETS,
  ENGINE_PRESETS,
  ENGINE_PRESETS_MULTI,
  getLogFilePath,
  runEngineTestV4,
} from "@dendronhq/common-test-utils";
import _ from "lodash";
import { DendronEngineV2 } from "../enginev2";

const createEngine = ({ vaults, wsRoot }: WorkspaceOpts) => {
  const logger = createLogger("testLogger", getLogFilePath("engine-server"));
  const engine = DendronEngineV2.createV3({ vaults, wsRoot, logger });
  return engine;
};

// describe.skip("schema import", () => {
//   let vaultDir: string;
//   let engine: DEngineV2;

//   beforeEach(async () => {
//     vaultDir = await EngineTestUtilsV2.setupVault({
//       initDirCb: async (dirPath: string) => {
//         const vault = { fsPath: dirPath };
//         await NodeTestUtilsV2.createSchemas({ vaultPath: dirPath });
//         await NodeTestUtilsV2.createNotes({ vaultPath: dirPath });

//         await NodeTestUtilsV2.createSchemaModuleOpts({
//           vaultDir: dirPath,
//           rootName: "bar",
//         });

//         let fname = "foo";
//         const fooSchema = SchemaUtilsV2.create({
//           fname,
//           id: fname,
//           parent: "root",
//           created: "1",
//           updated: "1",
//           children: ["bar.bar", "baz.baz"],
//           vault,
//         });
//         let module = SchemaUtilsV2.createModule({
//           version: 1,
//           schemas: [fooSchema],
//           imports: ["bar", "baz"],
//         });
//         await schemaModuleOpts2File(module, dirPath, fname);

//         fname = "baz";
//         const bazSchema = SchemaUtilsV2.create({
//           fname,
//           id: fname,
//           parent: "root",
//           created: "1",
//           updated: "1",
//           children: ["bar.bar", "ns"],
//           vault,
//         });
//         let childSchema = SchemaUtilsV2.create({
//           id: "ns",
//           namespace: true,
//           vault,
//         });
//         module = SchemaUtilsV2.createModule({
//           version: 1,
//           schemas: [bazSchema, childSchema],
//           imports: ["bar"],
//         });
//         await schemaModuleOpts2File(module, dirPath, fname);
//       },
//     });
//     engine = DendronEngineV2.createV3({
//       wsRoot,
//       vaults: [{ fsPath: vaultDir }],
//     });
//   });

//   test("basic", async () => {
//     const { error } = await engine.init();
//     expect(error).toBe(null);
//     expect(_.size(engine.schemas["foo"].schemas)).toEqual(7);
//     expect(_.size(engine.schemas["bar"].schemas)).toEqual(2);
//     expect(_.size(engine.schemas["baz"].schemas)).toEqual(4);
//     const vault = { fsPath: vaultDir };
//     await engine.writeNote(
//       NoteUtilsV2.create({ id: "foo.bar", fname: "foo.bar", vault })
//     );
//     const note = engine.notes["foo.bar"];
//     expect(note.schema).toEqual({
//       moduleId: "foo",
//       schemaId: "bar.bar",
//     });
//   });

//   test("double import", async () => {
//     const { error } = await engine.init();
//     expect(error).toBe(null);
//     const vault = { fsPath: vaultDir };
//     await engine.writeNote(
//       NoteUtilsV2.create({ id: "foo.baz.bar", fname: "foo.baz.bar", vault })
//     );
//     const note = engine.notes["foo.baz.bar"];
//     expect(note.schema).toEqual({
//       moduleId: "foo",
//       schemaId: "baz.bar.bar",
//     });
//   });

//   test("import and namespace", async () => {
//     const { error } = await engine.init();
//     expect(error).toBe(null);
//     const vault = { fsPath: vaultDir };
//     await engine.writeNote(
//       NoteUtilsV2.create({
//         id: "foo.baz.ns.one",
//         fname: "foo.baz.ns.one",
//         vault,
//       })
//     );
//     const note = engine.notes["foo.baz.ns.one"];
//     expect(note.schema).toEqual({
//       moduleId: "foo",
//       schemaId: "baz.ns",
//     });
//   });
// });

describe("engine, schemas/", () => {
  const nodeType = "SCHEMAS";

  ENGINE_PRESETS.forEach((pre) => {
    const { name, presets } = pre;
    describe(name, () => {
      test.each(
        // @ts-ignore
        _.map(presets[nodeType], (v, k) => {
          return [k, v];
        })
      )("%p", async (_key, TestCase) => {
        const { testFunc, ...opts } = TestCase;
        await runEngineTestV4(testFunc, { ...opts, createEngine, expect });
      });
    });
  });
});

describe.only("engine, notes/", () => {
  const nodeType = "NOTES";

  ENGINE_PRESETS.forEach((pre) => {
    const { name, presets } = pre;
    describe(name, () => {
      test.each(
        _.map(presets[nodeType], (v, k) => {
          return [k, v];
        })
      )("%p", async (_key, TestCase) => {
        const { testFunc, ...opts } = TestCase;
        await runEngineTestV4(testFunc, { ...opts, createEngine, expect });
      });
    });
  });
});

describe("engine, notes/multi/", () => {
  const nodeType = "NOTES";

  ENGINE_PRESETS_MULTI.forEach((pre) => {
    const { name, presets } = pre;
    describe(name, () => {
      test.each(
        _.map(presets[nodeType], (v, k) => {
          return [k, v];
        })
      )("%p", async (_key, TestCase) => {
        const { testFunc, ...opts } = TestCase;
        await runEngineTestV4(testFunc, { ...opts, createEngine, expect });
      });
    });
  });
});

describe("engine, config/", () => {
  _.map(ENGINE_CONFIG_PRESETS, (presets, name) => {
    describe(name, () => {
      test.each(
        _.map(presets, (v, k) => {
          return [k, v];
        })
      )("%p", async (_key, TestCase) => {
        const { testFunc, ...opts } = TestCase;
        await runEngineTestV4(testFunc, { ...opts, createEngine, expect });
      });
    });
  });
});
