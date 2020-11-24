import {
  DEngineClientV2,
  DNodeUtilsV2,
  DVault,
  NotePropsDictV2,
  NotePropsV2,
  NoteUtilsV2,
  SchemaModuleDictV2,
  SchemaModulePropsV2,
  SchemaUtilsV2,
} from "@dendronhq/common-all";
import { note2File, resolvePath } from "@dendronhq/common-server";
import _ from "lodash";
import { NoteTestUtilsV3 } from "../../noteUtils";
import { TestPresetEntry } from "../../utils";

const SCHEMAS = {
  WRITE: {
    BASICS: new TestPresetEntry({
      label: "basic",
      preSetupHook: async () => {},
      postSetupHook: async ({
        engine,
        vaults,
      }): Promise<{ noteToWrite: NotePropsV2 }> => {
        if (!engine) {
          throw new Error("no engine set");
        }
        const module = engine.schemas["foo"];
        const moduleRoot = module.schemas[module.root.id];
        const noteToWrite = await NoteTestUtilsV3.createNote({
          fname: "foo",
          vault: vaults[0],
          noWrite: true,
          props: { id: "ch2" },
        });
        DNodeUtilsV2.addChild(moduleRoot, noteToWrite);
        module.schemas[noteToWrite.id] = noteToWrite;
        await engine.updateSchema(module);
        return { noteToWrite };
      },
      results: async ({ engine }: { engine: DEngineClientV2 }) => {
        const resp = await engine.querySchema("*");
        return [
          {
            actual: _.values(engine.schemas).length,
            expected: 2,
          },
          {
            actual: _.values(engine.schemas["foo"].schemas).length,
            expected: 3,
          },
          {
            actual: resp.data.length,
            expected: 2,
            msg: "query should have same results",
          },
        ];
      },
    }),
  },
  INIT: {
    ROOT: new TestPresetEntry({
      label: "root",
      results: async ({
        schemas,
        vault,
      }: {
        schemas: SchemaModuleDictV2;
        vault: DVault;
      }) => {
        const schemaModRoot = schemas["root"] as SchemaModulePropsV2;
        return [
          {
            actual: _.trim(SchemaUtilsV2.serializeModuleProps(schemaModRoot)),
            expected: _.trim(`
version: 1
imports: []
schemas:
  - id: root
    children: []
    title: root
    parent: root
            `),
          },
          {
            actual: schemaModRoot.vault.fsPath,
            expected: vault.fsPath,
          },
        ];
      },
    }),
  },
};

const INIT = {
  WITH_BACKLINKS: new TestPresetEntry({
    label: "with backlinks",
    preSetupHook: async ({ vaults }: { vaults: DVault[]; wsRoot: string }) => {
      await NoteTestUtilsV3.createNote({
        fname: "alpha",
        body: "[[beta]]",
        vault: vaults[0],
      });
      await NoteTestUtilsV3.createNote({
        fname: "beta",
        body: "[[alpha]]",
        vault: vaults[0],
      });
    },
    results: async ({ notes }: { notes: NotePropsDictV2 }) => {
      const alpha = NoteUtilsV2.getNotesByFname({ fname: "alpha", notes })[0];
      const beta = NoteUtilsV2.getNotesByFname({ fname: "beta", notes })[0];
      const link = _.find(alpha.links, (l) => l.type === "backlink");
      return [
        {
          actual: alpha.links.length,
          expected: 2,
        },
        {
          actual: beta.links.length,
          expected: 2,
        },
        {
          actual: link?.from,
          expected: { fname: beta.fname, vault: beta.vault },
        },
      ];
    },
  }),
  WITH_BACKLINKS_V2: new TestPresetEntry({
    label: "with backlinks/ multiple links ",
    preSetupHook: async ({ vaults }: { vaults: DVault[]; wsRoot: string }) => {
      await NoteTestUtilsV3.createNote({
        fname: "alpha",
        body: "[[beta]],[[beta]]",
        vault: vaults[0],
      });
      await NoteTestUtilsV3.createNote({
        fname: "beta",
        body: "[[alpha]]",
        vault: vaults[0],
      });
    },
    results: async ({ notes }: { notes: NotePropsDictV2 }) => {
      const alpha = NoteUtilsV2.getNotesByFname({ fname: "alpha", notes })[0];
      const beta = NoteUtilsV2.getNotesByFname({ fname: "beta", notes })[0];
      const alphaLinks = _.filter(alpha.links, (l) => l.type === "backlink");
      const betaLinks = _.filter(beta.links, (l) => l.type === "backlink");
      return [
        {
          actual: alpha.links.length,
          expected: 3,
        },
        {
          actual: beta.links.length,
          expected: 3,
        },
        {
          actual: alphaLinks.length,
          expected: 1,
        },
        {
          actual: betaLinks.length,
          expected: 2,
        },
      ];
    },
  }),
  WITH_STUBS: new TestPresetEntry({
    label: "with stubs",
    before: async ({ vault, wsRoot }: { vault: DVault; wsRoot?: string }) => {
      const createNotes = ({ vault }: { vault: DVault }) => {
        const vaultPath = wsRoot
          ? resolvePath(vault.fsPath, wsRoot)
          : vault.fsPath;
        return Promise.all([
          note2File(
            NoteUtilsV2.create({ fname: "foo.journal.2020.08.29", vault }),
            vaultPath
          ),
          note2File(
            NoteUtilsV2.create({ fname: "foo.journal.2020.08.30", vault }),
            vaultPath
          ),
          note2File(
            NoteUtilsV2.create({ fname: "foo.journal.2020.08.31", vault }),
            vaultPath
          ),
        ]);
      };
      await createNotes({ vault });
    },
    results: async ({
      notes,
      vault,
    }: {
      notes: NotePropsDictV2;
      vault: DVault;
    }) => {
      const stubNotes = _.filter(notes, { stub: true });
      return [
        {
          actual: _.size(stubNotes),
          expected: 3,
        },
        {
          actual: stubNotes[0].vault,
          expected: vault,
        },
      ];
    },
  }),
};

const ENGINE_SINGLE_TEST_PRESET = {
  NOTES: {
    INIT,
  },
  SCHEMAS,
};

export default ENGINE_SINGLE_TEST_PRESET;
