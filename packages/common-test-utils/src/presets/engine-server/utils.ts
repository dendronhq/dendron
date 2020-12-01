import { SchemaUtilsV2 } from "@dendronhq/common-all";
import { NoteTestUtilsV4 } from "../../noteUtils";
import { PreSetupHookFunction } from "../../types";
import { NOTE_PRESETS_V4 } from "../notes";
import { SCHEMA_PRESETS_V4 } from "../schemas";

export const setupBasic: PreSetupHookFunction = async ({ vaults, wsRoot }) => {
  const vault = vaults[0];
  await NOTE_PRESETS_V4.NOTE_SIMPLE.create({
    vault,
    wsRoot,
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

export const setupSchemaPresetWithNamespaceTemplate: PreSetupHookFunction = async (
  opts
) => {
  await setupBasic(opts);
  const { wsRoot, vaults } = opts;
  const vault = vaults[0];
  NoteTestUtilsV4.createSchema({
    fname: "journal",
    wsRoot,
    vault,
    modifier: (schema) => {
      const schemas = [
        SchemaUtilsV2.create({
          id: "journal",
          parent: "root",
          children: ["year"],
          vault,
        }),
        SchemaUtilsV2.create({
          id: "year",
          pattern: "[0-2][0-9][0-9][0-9]",
          children: ["month"],
          vault,
        }),
        SchemaUtilsV2.create({
          id: "month",
          pattern: "[0-9][0-9]",
          children: ["day"],
          vault,
        }),
        SchemaUtilsV2.create({
          id: "day",
          pattern: "[0-9][0-9]",
          namespace: true,
          template: {
            id: "journal.template",
            type: "note",
          },
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
    body: "Template text",
    fname: "journal.template",
    vault,
  });
};

export const ENGINE_HOOKS = {
  setupBasic,
  setupSchemaPreseet,
  setupSchemaPresetWithNamespaceTemplate,
};
