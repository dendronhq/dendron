import {
  DNodeUtils,
  NoteProps,
  NoteUtils,
  SchemaUtils,
} from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import {
  FileTestUtils,
  NoteTestUtilsV4,
  NOTE_PRESETS_V4,
  SCHEMA_PRESETS_V4,
  TestPresetEntryV4,
} from "@dendronhq/common-test-utils";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { setupBasic } from "./utils";

const SCHEMAS = {
  ADD_NEW_SCHEMA: new TestPresetEntryV4(
    async ({ vaults, engine }) => {
      const schemaModId = SCHEMA_PRESETS_V4.SCHEMA_SIMPLE.fname;
      const module = engine.schemas[schemaModId];
      const vault = vaults[0];
      const schema = SchemaUtils.createFromSchemaRaw({ id: "ch2", vault });
      DNodeUtils.addChild(module.root, schema);
      module.schemas[schema.id] = schema;
      await engine.updateSchema(module);
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
    {
      preSetupHook: setupBasic,
    }
  ),
  ADD_NEW_MODULE_NO_CHILD: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      const vault = vaults[0];
      const schemaModNew =
        await SCHEMA_PRESETS_V4.SCHEMA_SIMPLE_OTHER_NO_CHILD.create({
          vault,
          wsRoot,
          noWrite: true,
        });
      await engine.writeSchema(schemaModNew);

      return [
        {
          actual: _.values(engine.schemas).length,
          expected: 3,
        },
        {
          actual: _.values(engine.schemas["bar"].schemas).length,
          expected: 1,
        },
      ];
    },
    {
      preSetupHook: setupBasic,
    }
  ),
  ADD_NEW_MODULE: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      const vault = vaults[0];
      const schemaModNew = await SCHEMA_PRESETS_V4.SCHEMA_SIMPLE_OTHER.create({
        vault,
        wsRoot,
        noWrite: true,
      });
      await engine.writeSchema(schemaModNew);

      return [
        {
          actual: _.values(engine.schemas).length,
          expected: 3,
        },
        {
          actual: _.values(engine.schemas["foo"].schemas).length,
          expected: 2,
        },
        {
          actual: _.values(engine.schemas["bar"].schemas).length,
          expected: 2,
        },
      ];
    },
    {
      preSetupHook: setupBasic,
    }
  ),
};

const NOTES = {
  SERIALIZE_CHILD_WITH_HIERARCHY: new TestPresetEntryV4(
    async ({ vaults, wsRoot, engine }) => {
      const noteNew = NoteUtils.create({
        fname: "foo.ch1",
        id: "foo.ch1",
        created: 1,
        updated: 1,
        vault: vaults[0],
      });
      await engine.writeNote(noteNew, { writeHierarchy: true });
      const vpath = vault2Path({ vault: vaults[0], wsRoot });
      const rawNote = fs.readFileSync(path.join(vpath, "foo.ch1.md"), {
        encoding: "utf8",
      });

      return [
        {
          actual: _.isNull(rawNote.match(/^parent: .*/gm)),
          expected: false,
          msg: "should have parent",
        },
      ];
    }
  ),

  CUSTOM_ATT: new TestPresetEntryV4(async ({ wsRoot, vaults, engine }) => {
    const note = await NOTE_PRESETS_V4.NOTE_WITH_CUSTOM_ATT.create({
      wsRoot,
      vault: vaults[0],
      noWrite: true,
    });
    await engine.writeNote(note);
    const noteRoot = NoteUtils.getNoteByFnameV5({
      fname: note.fname,
      notes: engine.notes,
      vault: vaults[0],
      wsRoot: engine.wsRoot,
    }) as NoteProps;
    return [
      {
        actual: noteRoot.fname,
        expected: "foo",
      },
      {
        actual: noteRoot.custom,
        expected: { bond: 42 },
      },
    ];
  }),
  CUSTOM_ATT_ADD: new TestPresetEntryV4(
    async ({ vaults, engine }) => {
      const note = NoteUtils.getNoteByFnameV5({
        fname: "foo",
        notes: engine.notes,
        vault: vaults[0],
        wsRoot: engine.wsRoot,
      }) as NoteProps;
      note.custom = { bond: 43 };
      await engine.writeNote(note, { updateExisting: true });
      const newNote = NoteUtils.getNoteByFnameV5({
        fname: "foo",
        notes: engine.notes,
        vault: vaults[0],
        wsRoot: engine.wsRoot,
      }) as NoteProps;
      return [
        {
          actual: newNote,
          expected: note,
        },
      ];
    },
    {
      preSetupHook: async ({ vaults, wsRoot }) => {
        await NoteTestUtilsV4.createNote({
          fname: "foo",
          vault: vaults[0],
          wsRoot,
        });
      },
    }
  ),
  NEW_DOMAIN: new TestPresetEntryV4(async ({ vaults, engine }) => {
    const vault = vaults[0];
    const noteNew = NoteUtils.create({
      id: "bar",
      fname: "bar",
      created: 1,
      updated: 1,
      vault: vaults[0],
    });
    await engine.writeNote(noteNew);

    const resp = await engine.queryNotes({ qs: "bar", vault });
    const note = resp.data[0];

    return [
      {
        actual: note,
        expected: engine.notes[note.id],
        msg: "bar should be written in engine",
      },
      {
        actual: DNodeUtils.isRoot(engine.notes[note.parent as string]),
        expected: true,
      },
    ];
  }),
  MATCH_SCHEMA: new TestPresetEntryV4(
    async ({ vaults, engine }) => {
      const vault = vaults[0];
      const noteNew = NoteUtils.create({
        fname: "foo.ch1",
        created: 1,
        updated: 1,
        vault,
      });
      await engine.writeNote(noteNew);

      return [
        {
          actual: NoteUtils.getNoteByFnameV5({
            fname: "foo.ch1",
            notes: engine.notes,
            vault,
            wsRoot: engine.wsRoot,
          })?.schema,
          expected: {
            moduleId: "foo",
            schemaId: "ch1",
          },
        },
      ];
    },
    {
      preSetupHook: async ({ vaults, wsRoot }) => {
        await NoteTestUtilsV4.createSchema({
          fname: "foo",
          vault: vaults[0],
          wsRoot,
          modifier: (schema) => {
            schema.schemas["ch1"] = SchemaUtils.createFromSchemaRaw({
              id: "ch1",
              vault: vaults[0],
            });
            DNodeUtils.addChild(schema.root, schema.schemas["ch1"]);
            return schema;
          },
        });
      },
    }
  ),
  DOMAIN_STUB: new TestPresetEntryV4(async ({ engine, vaults, wsRoot }) => {
    const note = await NoteTestUtilsV4.createNote({
      fname: "bar.ch1",
      vault: vaults[0],
      wsRoot,
      noWrite: true,
    });
    await engine.writeNote(note);
    const { notes } = engine;
    const vault = vaults[0];
    const root = NoteUtils.getNoteByFnameV5({
      fname: "root",
      notes,
      vault,
      wsRoot: engine.wsRoot,
    }) as NoteProps;
    const bar = NoteUtils.getNoteByFnameV5({
      fname: "bar",
      notes,
      vault,
      wsRoot: engine.wsRoot,
    }) as NoteProps;
    const child = NoteUtils.getNoteByFnameV5({
      fname: "bar.ch1",
      notes,
      vault,
      wsRoot: engine.wsRoot,
    }) as NoteProps;
    return [
      {
        actual: _.size(root.children),
        expected: 1,
        msg: "root, foo, bar",
      },
      {
        actual: _.pick(bar, "stub"),
        expected: { stub: true },
        msg: "bar created as stub",
      },
      {
        actual: _.pick(child, ["fname", "stub"]),
        expected: { fname: "bar.ch1" },
        msg: "child is not stub",
      },
    ];
  }),
  GRANDCHILD_OF_ROOT_AND_CHILD_IS_STUB: new TestPresetEntryV4(
    async ({ vaults, wsRoot, engine }) => {
      const noteNew = NoteUtils.create({
        fname: "bond.ch1",
        created: 1,
        updated: 1,
        vault: vaults[0],
      });
      await engine.writeNote(noteNew);
      const checkVault = await FileTestUtils.assertInVault({
        wsRoot,
        vault: vaults[0],
        match: ["bond.ch1.md"],
        nomatch: ["bond.md"],
      });
      return [
        {
          actual: checkVault,
          expected: true,
        },
      ];
    }
  ),
  CHILD_OF_DOMAIN: new TestPresetEntryV4(
    async ({ vaults, wsRoot, engine }) => {
      const noteNew = NoteUtils.create({
        fname: "foo.ch2",
        vault: vaults[0],
      });
      await engine.writeNote(noteNew);
      const checkVault = await FileTestUtils.assertInVault({
        wsRoot,
        vault: vaults[0],
        match: ["foo.md", "foo.ch2.md"],
      });
      return [
        {
          actual: checkVault,
          expected: true,
        },
      ];
    },
    {
      preSetupHook: async ({ vaults, wsRoot }) => {
        await NoteTestUtilsV4.createNote({
          fname: "foo",
          vault: vaults[0],
          wsRoot,
        });
      },
    }
  ),
  GRANDCHILD_OF_DOMAIN_AND_CHILD_IS_STUB: new TestPresetEntryV4(
    async ({ vaults, wsRoot, engine }) => {
      const noteNew = NoteUtils.create({
        fname: "foo.ch2.gch1",
        vault: vaults[0],
      });
      await engine.writeNote(noteNew);
      const checkVault = await FileTestUtils.assertInVault({
        wsRoot,
        vault: vaults[0],
        match: ["foo.md", "foo.ch2.gch1.md"],
        nomatch: ["foo.ch2.md"],
      });
      return [
        {
          actual: checkVault,
          expected: true,
        },
      ];
    },
    {
      preSetupHook: async ({ vaults, wsRoot }) => {
        await NoteTestUtilsV4.createNote({
          fname: "foo",
          vault: vaults[0],
          wsRoot,
        });
      },
    }
  ),
  TITLE_MATCHES_TITLE_CASE: new TestPresetEntryV4(
    async ({ vaults, wsRoot, engine }) => {
      const vault = vaults[0];
      const noteA = await NoteTestUtilsV4.createNote({
        fname: "Upper Upper",
        vault: vaults[0],
        wsRoot,
      });
      await engine.writeNote(noteA);
      const noteB = await NoteTestUtilsV4.createNote({
        fname: "lower lower",
        vault: vaults[0],
        wsRoot,
      });
      await engine.writeNote(noteB);
      const noteC = await NoteTestUtilsV4.createNote({
        fname: "lower Upper",
        vault: vaults[0],
        wsRoot,
      });
      await engine.writeNote(noteC);
      return [
        {
          actual: NoteUtils.getNoteByFnameV5({
            fname: "Upper Upper",
            notes: engine.notes,
            vault,
            wsRoot: engine.wsRoot,
          })?.title,
          expected: "Upper Upper",
        },
        {
          actual: NoteUtils.getNoteByFnameV5({
            fname: "lower lower",
            notes: engine.notes,
            vault,
            wsRoot: engine.wsRoot,
          })?.title,
          expected: "Lower Lower",
        },
        {
          actual: NoteUtils.getNoteByFnameV5({
            fname: "lower Upper",
            notes: engine.notes,
            vault,
            wsRoot: engine.wsRoot,
          })?.title,
          expected: "lower Upper",
        },
      ];
    }
  ),
  TITLE_WITH_DASH: new TestPresetEntryV4(async ({ vaults, wsRoot, engine }) => {
    const vault = vaults[0];
    const noteA = await NoteTestUtilsV4.createNote({
      fname: "foo-with-dash",
      vault: vaults[0],
      wsRoot,
    });
    // this should still only get last component
    const noteB = await NoteTestUtilsV4.createNote({
      fname: "foo.foo-with-dash",
      vault: vaults[0],
      wsRoot,
    });
    await engine.writeNote(noteA);
    await engine.writeNote(noteB);
    return [
      {
        actual: NoteUtils.getNoteByFnameV5({
          fname: "foo-with-dash",
          notes: engine.notes,
          vault,
          wsRoot: engine.wsRoot,
        })?.title,
        expected: "Foo with Dash",
      },
      {
        actual: NoteUtils.getNoteByFnameV5({
          fname: "foo.foo-with-dash",
          notes: engine.notes,
          vault,
          wsRoot: engine.wsRoot,
        })?.title,
        expected: "Foo with Dash",
      },
    ];
  }),
};
const NOTES_MULTI = {
  NEW_DOMAIN: new TestPresetEntryV4(async ({ vaults, engine }) => {
    const vault = vaults[1];
    const noteNew = NoteUtils.create({
      id: "bar",
      fname: "bar",
      created: 1,
      updated: 1,
      vault: vaults[1],
    });
    await engine.writeNote(noteNew);

    const resp = await engine.queryNotes({ qs: "bar", vault });
    const note = resp.data[0];

    return [
      {
        actual: note,
        expected: engine.notes[note.id],
        msg: "bar should be written in engine",
      },
      {
        actual: DNodeUtils.isRoot(engine.notes[note.parent as string]),
        expected: true,
      },
    ];
  }),
  NEW_DOMAIN_WITH_FULL_PATH_VAULT: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      const vault = { ...vaults[1] };
      vault.fsPath = path.join(wsRoot, vault.fsPath);
      const noteNew = NoteUtils.create({
        id: "bar",
        fname: "bar",
        created: 1,
        updated: 1,
        vault: vaults[1],
      });
      await engine.writeNote(noteNew);

      const resp = await engine.queryNotes({ qs: "bar", vault });
      const note = resp.data[0];

      return [
        {
          actual: note,
          expected: engine.notes[note.id],
          msg: "bar should be written in engine",
        },
        {
          actual: DNodeUtils.isRoot(engine.notes[note.parent as string]),
          expected: true,
        },
      ];
    }
  ),
};

export const ENGINE_WRITE_PRESETS = {
  NOTES,
  SCHEMAS,
};
export const ENGINE_WRITE_PRESETS_MULTI = {
  NOTES: NOTES_MULTI,
};
