import { SchemaUtilsV2 } from "@dendronhq/common-all";
import { NoteTestUtilsV4 } from "../../noteUtils";
import { PreSetupHookFunction } from "../../types";
import { NOTE_PRESETS_V4 } from "../notes";
import { SCHEMA_PRESETS_V4 } from "../schemas";

/**
 * Notes created:
 *   - vault1:
 *     - foo
 *     - foo.ch1
 *   - vault2:
 *     - bar
 */
export const setupBasic: PreSetupHookFunction = async ({
  vaults,
  wsRoot,
  extra,
}) => {
  const vault = vaults[0];
  // TODO: HACK
  let props;
  if (extra?.idv2) {
    props = { id: "foo-id" };
  }
  await NOTE_PRESETS_V4.NOTE_SIMPLE.create({
    vault,
    wsRoot,
    props,
  });
  await NOTE_PRESETS_V4.NOTE_SIMPLE_CHILD.create({
    vault,
    wsRoot,
  });
  await NOTE_PRESETS_V4.NOTE_SIMPLE_OTHER.create({
    vault,
    wsRoot,
  });
  await SCHEMA_PRESETS_V4.SCHEMA_SIMPLE.create({ vault, wsRoot });
};

export const setupBasicMulti: PreSetupHookFunction = async ({
  vaults,
  wsRoot,
}) => {
  const vault1 = vaults[0];
  const vault2 = vaults[1];
  await NOTE_PRESETS_V4.NOTE_SIMPLE.create({
    vault: vault1,
    wsRoot,
  });
  await NOTE_PRESETS_V4.NOTE_SIMPLE_CHILD.create({
    vault: vault1,
    wsRoot,
  });
  await NOTE_PRESETS_V4.NOTE_SIMPLE_OTHER.create({
    vault: vault2,
    wsRoot,
  });
  await SCHEMA_PRESETS_V4.SCHEMA_SIMPLE.create({ vault: vault1, wsRoot });
};

export const setupNoteRefRecursive: PreSetupHookFunction = async ({
  vaults,
  wsRoot,
  extra,
}) => {
  const vault = vaults[0];
  // TODO: HACK
  let props;
  if (extra?.idv2) {
    props = { id: "foo-id" };
  }
  await NOTE_PRESETS_V4.NOTE_SIMPLE.create({
    vault,
    wsRoot,
    body: "((ref: [[foo.one]]))",
    props,
  });
  await NoteTestUtilsV4.createNote({
    vault,
    fname: "foo.one",
    body: ["# Foo.One", `((ref: [[foo.two]]))`].join("\n"),
    wsRoot,
    props: {
      id: "foo.one-id",
    },
  });
  await NoteTestUtilsV4.createNote({
    vault,
    fname: "foo.two",
    body: ["# Foo.Two", `blah`].join("\n"),
    wsRoot,
  });
};

export const setupSchemaPreseet: PreSetupHookFunction = async (opts) => {
  await setupBasic(opts);
  const { wsRoot, vaults } = opts;
  const vault = vaults[0];
  NoteTestUtilsV4.createSchema({
    fname: "bar",
    wsRoot,
    vault,
    modifier: (schema) => {
      const schemas = [
        SchemaUtilsV2.create({
          id: "bar",
          parent: "root",
          children: ["ch1", "ch2"],
          vault,
        }),
        SchemaUtilsV2.create({
          id: "ch1",
          template: { id: "bar.template.ch1", type: "note" },
          vault,
        }),
        SchemaUtilsV2.create({
          id: "ch2",
          template: { id: "bar.template.ch2", type: "note" },
          namespace: true,
          vault,
        }),
      ];
      schemas.map((s) => {
        schema.schemas[s.id] = s;
      });
      return schema;
    },
  });
  await NoteTestUtilsV4.createNote({
    wsRoot,
    body: "ch1 template",
    fname: "bar.template.ch1",
    vault,
  });
  await NoteTestUtilsV4.createNote({
    wsRoot,
    body: "ch2 template",
    fname: "bar.template.ch2",
    vault,
  });
};

export const setupSchemaPresetWithNamespaceTemplateBase: PreSetupHookFunction = async (
  opts
) => {
  await setupBasic(opts);
  const { wsRoot, vaults } = opts;
  const vault1 = vaults[0];
  const vault2 = vaults[1];
  NoteTestUtilsV4.createSchema({
    fname: "journal",
    wsRoot,
    vault: vault1,
    modifier: (schema) => {
      const schemas = [
        SchemaUtilsV2.create({
          id: "daily",
          parent: "root",
          children: ["journal"],
          vault: vault1,
        }),
        SchemaUtilsV2.create({
          id: "journal",
          children: ["year"],
          vault: vault1,
        }),
        SchemaUtilsV2.create({
          id: "year",
          pattern: "[0-2][0-9][0-9][0-9]",
          children: ["month"],
          vault: vault1,
        }),
        SchemaUtilsV2.create({
          id: "month",
          pattern: "[0-9][0-9]",
          children: ["day"],
          vault: vault1,
        }),
        SchemaUtilsV2.create({
          id: "day",
          pattern: "[0-9][0-9]",
          namespace: true,
          template: {
            id: "journal.template",
            type: "note",
          },
          vault: vault2,
        }),
      ];
      schemas.map((s) => {
        schema.schemas[s.id] = s;
      });
      return schema;
    },
  });
  await NoteTestUtilsV4.createNote({
    wsRoot,
    body: "Journal",
    fname: "daily",
    vault: vault2,
  });
  await NoteTestUtilsV4.createNote({
    wsRoot,
    body: "Template text",
    fname: "journal.template",
    vault: vault2,
  });
};

export const setupSchemaPresetWithNamespaceTemplateMulti: PreSetupHookFunction = async (
  opts
) => {
  return setupSchemaPresetWithNamespaceTemplateBase(opts);
};

export const setupSchemaPresetWithNamespaceTemplate: PreSetupHookFunction = async (
  opts
) => {
  const vault = opts.vaults[0];
  return setupSchemaPresetWithNamespaceTemplateBase({
    ...opts,
    vaults: [vault, vault],
  });
};

export const ENGINE_HOOKS = {
  setupBasic,
  setupSchemaPreseet,
  setupSchemaPresetWithNamespaceTemplate,
  setupNoteRefRecursive,
};

export const ENGINE_HOOKS_MULTI = {
  setupBasicMulti,
  setupSchemaPresetWithNamespaceTemplateMulti,
};
