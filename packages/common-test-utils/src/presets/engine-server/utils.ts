import { SchemaUtils } from "@dendronhq/common-all";
import _ from "lodash";
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

export const setupJournals: PreSetupHookFunction = async ({
  vaults,
  wsRoot,
}) => {
  const vault = vaults[0];
  const names = [
    "daily",
    "daily.journal",
    "daily.journal.2020",
    "daily.journal.2020.07",
    "daily.journal.2020.07.01.one",
    "daily.journal.2020.07.05.two",
  ];
  return Promise.all(
    names.map((fname) => {
      return NoteTestUtilsV4.createNote({
        wsRoot,
        vault,
        fname,
      });
    })
  );
};

export const setupBasicMulti: PreSetupHookFunction = async ({
  vaults,
  wsRoot,
}) => {
  const vault1 = _.find(vaults, { fsPath: "vault1" })!;
  const vault2 = _.find(vaults, { fsPath: "vault2" })!;
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

/**
 * Raw:
 * ![[foo.one]]
 *
 * End Format:
 * # Foo.One
 * <noteRef>
 * # Foo.Two
 * blah
 * </noteRef>
 * Regular wikilink: [[foo.two]]
 */
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
    body: "![[foo.one]]",
    props,
  });
  await NoteTestUtilsV4.createNote({
    vault,
    fname: "foo.one",
    body: ["# Foo.One", `![[foo.two]]`, `Regular wikilink: [[foo.two]]`].join(
      "\n"
    ),
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
        SchemaUtils.create({
          id: "bar",
          parent: "root",
          children: ["ch1", "ch2"],
          vault,
        }),
        SchemaUtils.create({
          id: "ch1",
          template: { id: "bar.template.ch1", type: "note" },
          vault,
        }),
        SchemaUtils.create({
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
        SchemaUtils.create({
          id: "daily",
          parent: "root",
          children: ["journal"],
          vault: vault1,
        }),
        SchemaUtils.create({
          id: "journal",
          children: ["year"],
          vault: vault1,
        }),
        SchemaUtils.create({
          id: "year",
          pattern: "[0-2][0-9][0-9][0-9]",
          children: ["month"],
          vault: vault1,
        }),
        SchemaUtils.create({
          id: "month",
          pattern: "[0-9][0-9]",
          children: ["day"],
          vault: vault1,
        }),
        SchemaUtils.create({
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

export const setupEmpty: PreSetupHookFunction = async ({ vaults, wsRoot }) => {
  const vault = vaults[0];
  await NOTE_PRESETS_V4.NOTE_EMPTY.create({
    vault,
    wsRoot,
  });
};

export const setupLinks: PreSetupHookFunction = async ({ vaults, wsRoot }) => {
  return setupLinksBase({ wsRoot, vaults: [vaults[0], vaults[0]] });
};

export const setupLinksMulti: PreSetupHookFunction = async ({
  vaults,
  wsRoot,
}) => {
  return setupLinksBase({ wsRoot, vaults });
};

export const setupLinksBase: PreSetupHookFunction = async ({
  vaults,
  wsRoot,
}) => {
  const vault1 = vaults[0];
  const vault2 = vaults[1];
  // create note with wikilink
  await NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
    vault: vault1,
    wsRoot,
  });
  // create note with relative wikilink
  await NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_LINK.create({
    vault: vault2,
    wsRoot,
  });
  // create note with labeld wikilink
  await NoteTestUtilsV4.createNote({
    wsRoot,
    body: "[[some label|beta]]",
    fname: "omega",
    vault: vault1,
  });
};

export const setupLinksWithVaultBase: PreSetupHookFunction = async ({
  vaults,
  wsRoot,
}) => {
  await setupLinksBase({ vaults, wsRoot });
};

export const setupRefs: PreSetupHookFunction = async ({ vaults, wsRoot }) => {
  const vault = vaults[0];
  // create note with note reference
  await NOTE_PRESETS_V4.NOTE_WITH_NOTE_REF_SIMPLE.create({
    vault,
    wsRoot,
  });
  await NOTE_PRESETS_V4.NOTE_WITH_NOTE_REF_SIMPLE_TARGET.create({
    vault,
    wsRoot,
  });
  // create note with block reference
  await NOTE_PRESETS_V4.NOTE_WITH_BLOCK_REF_SIMPLE.create({
    vault,
    wsRoot,
  });
  // create note with block range reference
  await NOTE_PRESETS_V4.NOTE_WITH_BLOCK_RANGE_REF_SIMPLE.create({
    vault,
    wsRoot,
  });
  // create note with reference offset
  await NOTE_PRESETS_V4.NOTE_WITH_REF_OFFSET.create({
    vault,
    wsRoot,
  });
  // create note with wildcard child reference
  await NOTE_PRESETS_V4.NOTE_WITH_WILDCARD_CHILD_REF.create({
    vault,
    wsRoot,
  });
  // create note with wildcard header reference
  await NOTE_PRESETS_V4.NOTE_WITH_WILDCARD_HEADER_REF.create({
    vault,
    wsRoot,
  });
  // create note with complex wildcard reference
  await NOTE_PRESETS_V4.NOTE_WITH_WILDCARD_COMPLEX.create({
    vault,
    wsRoot,
  });
};

export const ENGINE_HOOKS_BASE = {
  WITH_LINKS: setupLinksBase,
};

export const ENGINE_HOOKS = {
  setupBasic,
  setupSchemaPreseet,
  setupSchemaPresetWithNamespaceTemplate,
  setupNoteRefRecursive,
  setupJournals,
  setupEmpty,
  setupLinks,
  setupRefs,
};

export const ENGINE_HOOKS_MULTI = {
  setupBasicMulti,
  setupLinksMulti,
  setupSchemaPresetWithNamespaceTemplateMulti,
};
