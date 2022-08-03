import { NoteProps, SchemaUtils } from "@dendronhq/common-all";
import {
  CreateNoteFactory,
  NOTE_PRESETS_V4,
  NoteTestUtilsV4,
  PreSetupHookFunction,
  SCHEMA_PRESETS_V4,
} from "@dendronhq/common-test-utils";
import _ from "lodash";
import { resolvePath } from "@dendronhq/common-server";
import path from "path";
import * as fs from "fs";

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

/**
 <pre>
 /vault1
 ├── bar.ch1.gch1.ggch1.md
 ├── bar.ch1.gch1.md
 ├── bar.ch1.md
 ├── bar.md
 ├── foo.ch1.gch1.ggch1.md
 ├── foo.ch1.gch1.md
 ├── foo.ch1.gch2.md
 ├── foo.ch1.md
 ├── foo.ch2.md
 ├── foo.md
 ├── root.md
 └── root.schema.yml

/vault2
 ├── root.md
 └── root.schema.yml

 /vault3
 ├── root.md
 └── root.schema.yml
</pre>
 * */
export const setupHierarchyForLookupTests: PreSetupHookFunction = async ({
  vaults,
  wsRoot,
}) => {
  const opts = {
    vault: vaults[0],
    wsRoot,
  };
  const fnames = [
    "foo",
    "foo.ch1",
    "foo.ch1.gch1",
    "foo.ch1.gch1.ggch1",
    "foo.ch1.gch2",
    "foo.ch2",
    "bar",
    "bar.ch1",
    "bar.ch1.gch1",
    "bar.ch1.gch1.ggch1",
    "goo.ends-with-ch1.no-ch1-by-itself",
  ];

  for (const fname of fnames) {
    await CreateNoteFactory({ fname, body: `${fname} body` }).create(opts);
  }
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

// Workspace will look like:
// .
// ├── dendron.code-workspace
// ├── dendron.yml
// ├── vault1
// │   ├── foo.ch1.md
// │   ├── foo.md
// │   ├── foo.schema.yml
// │   ├── root.md
// │   └── root.schema.yml
// ├── vault2
// │   ├── bar.md
// │   ├── root.md
// │   └── root.schema.yml
// └── vault3
//     ├── root.md
//     └── root.schema.yml
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
 *
 * - foo
 * ```
 * ![[foo.one]]
 * ```
 *
 * - foo.one
 * ```
 * # Foo.One
 * ![[foo.two]]
 * Regular wikilink: [[foo.two]]
 * ```
 *
 * - foo.two
 * ```
 * # Foo.Two
 * blah
 * ```
 *
 *
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

/**
 * Diamond schema is laid out such that:
 *    bar
 *   /   \
 * ch1   ch2
 *   \   /
 *    gch
 * */
export const setupSchemaWithDiamondGrandchildren: PreSetupHookFunction = async (
  opts
) => {
  await setupBasic(opts);
  const { wsRoot, vaults } = opts;
  const vault = vaults[0];
  NoteTestUtilsV4.createSchema({
    fname: "bar",
    wsRoot,
    vault,
    modifier: (schema) => {
      const schemas = [
        SchemaUtils.createFromSchemaOpts({
          id: "bar",
          parent: "root",
          fname: "bar",
          children: ["ch1", "ch2"],
          vault,
        }),
        SchemaUtils.createFromSchemaRaw({
          id: "ch1",
          children: ["gch"],
          vault,
        }),
        SchemaUtils.createFromSchemaRaw({
          id: "ch2",
          children: ["gch"],
          vault,
        }),
        SchemaUtils.createFromSchemaRaw({
          id: "gch",
          template: { id: "template.gch", type: "note" },
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
    body: "gch template",
    fname: "template.gch",
    vault,
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
        SchemaUtils.createFromSchemaOpts({
          id: "bar",
          parent: "root",
          fname: "bar",
          children: ["ch1", "ch2"],
          vault,
        }),
        SchemaUtils.createFromSchemaRaw({
          id: "ch1",
          template: { id: "bar.template.ch1", type: "note" },
          vault,
        }),
        SchemaUtils.createFromSchemaRaw({
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
    props: { tags: "tag-foo" },
    vault,
  });
  await NoteTestUtilsV4.createNote({
    wsRoot,
    body: "ch2 template",
    fname: "bar.template.ch2",
    vault,
  });
};

/**
 * Diamond schema is laid out such that:
 *    bar
 *   /   \
 * ch1   ch2 (namespace: true)
 *   \   /
 *    gch
 * */
export const setupSchemaWithDiamondAndParentNamespace: PreSetupHookFunction =
  async (opts) => {
    await setupBasic(opts);
    const { wsRoot, vaults } = opts;
    const vault1 = vaults[0];

    const withDiamond = path.join(
      resolvePath(vault1.fsPath, wsRoot),
      "withDiamond.schema.yml"
    );
    fs.writeFileSync(
      withDiamond,
      `
version: 1
schemas:
  - id: withDiamond
    children:
      - ch1
      - ch2
    title: withDiamond
    parent: root
  - id: ch1
    children:
      - gch
  - id: ch2
    namespace: true
    children:
      - gch
  - id: gch
    template: template.test
`
    );

    await NoteTestUtilsV4.createNote({
      wsRoot,
      body: "Template text",
      fname: "template.test",
      vault: vault1,
    });
  };

/**
 * Sets up schema which includes a schema that has Diamond grandchildren
 *
 * */
export const setupSchemaWithIncludeOfDiamond: PreSetupHookFunction = async (
  opts
) => {
  await setupBasic(opts);
  const { wsRoot, vaults } = opts;
  const vault1 = vaults[0];

  const withDiamond = path.join(
    resolvePath(vault1.fsPath, wsRoot),
    "withDiamond.schema.yml"
  );
  fs.writeFileSync(
    withDiamond,
    `
version: 1
schemas:
  - id: withDiamond
    children:
      - ch1
      - ch2
    title: withDiamond
    parent: root
  - id: ch1
    children:
      - gch
  - id: ch2
    children:
      - gch
  - id: gch
    template: template.test
`
  );

  const includesDiamondPath = path.join(
    resolvePath(vault1.fsPath, wsRoot),
    "includesDiamond.schema.yml"
  );
  fs.writeFileSync(
    includesDiamondPath,
    `
version: 1

imports:
  - withDiamond

schemas:
  - id: includesDiamond
    parent: root
    namespace: true
    children:
      - a-ch1
      - a-ch2
  - id: a-ch1
    children:
      - withDiamond.gch
  - id: a-ch2
    children:
      - withDiamond.gch
`
  );

  await NoteTestUtilsV4.createNote({
    wsRoot,
    body: "Template text",
    fname: "template.test",
    vault: vault1,
  });
};

/**
 * Sets up workspace which has a schema that uses YAML expansion syntax ('<<' type of expansion). */
export const setupSchemaWithExpansion: PreSetupHookFunction = async (opts) => {
  await setupBasic(opts);
  const { wsRoot, vaults } = opts;
  const vault1 = vaults[0];

  const withExpansion = path.join(
    resolvePath(vault1.fsPath, wsRoot),
    "withExpansion.schema.yml"
  );
  fs.writeFileSync(
    withExpansion,
    `
_anchors:
  projects: &projects
    title: projects
    parent: root
    template: templates.projects
    
version: 1
imports: []

schemas:
  - <<: *projects
    id: proj
  - <<: *projects
    id: op
`
  );

  const inlineSchemaPath = path.join(
    resolvePath(vault1.fsPath, wsRoot),
    "includesExpansion.schema.yml"
  );
  fs.writeFileSync(
    inlineSchemaPath,
    `
version: 1

imports:
  - withExpansion

schemas:
  - id: includer
    parent: root
    namespace: true
    children:
      - withExpansion.proj
`
  );

  await NoteTestUtilsV4.createNote({
    wsRoot,
    body: "Template text",
    fname: "templates.projects",
    vault: vault1,
  });
};

export const setupInlineSchema: PreSetupHookFunction = async (opts) => {
  await setupBasic(opts);
  const { wsRoot, vaults } = opts;
  const vault1 = vaults[0];

  const inlineSchemaPath = path.join(
    resolvePath(vault1.fsPath, wsRoot),
    "inlined.schema.yml"
  );
  fs.writeFileSync(
    inlineSchemaPath,
    `
version: 1
imports: 
  - foo
schemas:
  - id: plain_schema
    parent: root
    children:
      - plain_schema_child
      - daily
  - id: daily
    parent: root
    children:
      - id: journal
        children:
          - pattern: "[0-2][0-9][0-9][0-9]"
            title: year
            id: year_id
            children:
              - pattern: "[0-1][0-9]"
                children:
                  - pattern: "[0-3][0-9]"
                    title: day
                    template:
                      id: templates.day
                      type: note
  - id: id_with_imported_child
    children:
      - foo.foo
  - id: with_child_that_has_untyped_template
    children:
      - pattern: has_untyped_template
        template: templates.untyped
  - id: plain_schema_child
    template: templates.example
`
  );

  await NoteTestUtilsV4.createNote({
    wsRoot,
    body: "Template text",
    fname: "templates.day",
    vault: vault1,
  });

  await NoteTestUtilsV4.createNote({
    wsRoot,
    body: "Template text",
    fname: "templates.example",
    vault: vault1,
  });

  await NoteTestUtilsV4.createNote({
    wsRoot,
    body: "Untyped template",
    fname: "templates.untyped",
    vault: vault1,
  });
};

export const setupSchemaPresetWithNamespaceTemplateBase: PreSetupHookFunction =
  async (opts) => {
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
          SchemaUtils.createFromSchemaOpts({
            id: "daily",
            parent: "root",
            fname: "daily",
            children: ["journal"],
            vault: vault1,
          }),
          SchemaUtils.createFromSchemaRaw({
            id: "journal",
            children: ["year"],
            vault: vault1,
          }),
          SchemaUtils.createFromSchemaRaw({
            id: "year",
            pattern: "[0-2][0-9][0-9][0-9]",
            children: ["month"],
            vault: vault1,
          }),
          SchemaUtils.createFromSchemaRaw({
            id: "month",
            pattern: "[0-9][0-9]",
            children: ["day"],
            vault: vault1,
          }),
          SchemaUtils.createFromSchemaRaw({
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

export const setupSchemaPresetWithNamespaceTemplateMulti: PreSetupHookFunction =
  async (opts) => {
    return setupSchemaPresetWithNamespaceTemplateBase(opts);
  };

export const setupSchemaPresetWithNamespaceTemplate: PreSetupHookFunction =
  async (opts) => {
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

/** Creates 2 notes with same fname in 2 different vaults, and a note named
 * "test" in second vault with both valid and invalid wikilinks.
 *
 * See [[scratch.2021.07.15.205433.inconsistent-ref-and-link-behavior]] for the
 * invalid behaviors that this is intended to test for. The only difference is
 * that vaultThree is the real vault and vault3 is the bad one.
 *
 * @returns the test note with the wikilinks.
 */
export const setupMultiVaultSameFname: PreSetupHookFunction = async ({
  vaults,
  wsRoot,
}): Promise<NoteProps> => {
  await NoteTestUtilsV4.createNote({
    fname: "eggs",
    vault: vaults[0],
    body: "vault 0",
    wsRoot,
    props: { id: "eggs-vault-0" },
  });
  await NoteTestUtilsV4.createNote({
    fname: "eggs",
    vault: vaults[1],
    body: "vault 1",
    wsRoot,
    props: { id: "eggs-vault-1" },
  });
  return NoteTestUtilsV4.createNote({
    fname: "test",
    vault: vaults[1],
    body: [
      "[[eggs]]", // 7
      "[[dendron://vault1/eggs]]", // 8
      "[[dendron://vault2/eggs]]", // 9
      "[[dendron://vaultThree/eggs]]", // 10
      "[[dendron://vault3/eggs]]", // 11
      "",
      "the test note",
    ].join("\n"),
    wsRoot,
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
  // create note with fm variables
  await NOTE_PRESETS_V4.NOTE_WITH_FM_VARIABLES.create({
    vault,
    wsRoot,
  });
};

export const ENGINE_HOOKS_BASE = {
  WITH_LINKS: setupLinksBase,
};

export const ENGINE_HOOKS = {
  setupBasic,
  setupHierarchyForLookupTests,
  setupSchemaPreseet,
  setupSchemaWithDiamondGrandchildren,
  setupSchemaWithIncludeOfDiamond,
  setupSchemaWithDiamondAndParentNamespace,
  setupSchemaPresetWithNamespaceTemplate,
  setupInlineSchema,
  setupSchemaWithExpansion,
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
  setupMultiVaultSameFname,
};
