import {
  DEngineClient,
  DVault,
  GetNoteBlocksPayload,
  NoteProps,
  NoteUtils,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import {
  NoteTestUtilsV4,
  TestPresetEntryV4,
  TestResult,
} from "@dendronhq/common-test-utils";
import _ from "lodash";

const runGetNoteBlocks = async ({
  engine,
  vaults,
  note,
  wsRoot,
  cb,
}: {
  engine: DEngineClient;
  vaults: DVault[];
  wsRoot: string;
  note?: NoteProps;
  cb: (opts: GetNoteBlocksPayload) => TestResult[];
}) => {
  if (_.isUndefined(note))
    note = NoteUtils.getNoteByFnameV5({
      fname: "test",
      notes: engine.notes,
      vault: vaults[0],
      wsRoot,
    });
  const out = await engine.getNoteBlocks({
    id: note!.id,
  });
  return cb(out);
};

const preSetupHook = async (
  { vaults, wsRoot }: WorkspaceOpts,
  { noteBody, fname }: { noteBody: string; fname?: string }
) => {
  await NoteTestUtilsV4.createNote({
    vault: vaults[0],
    wsRoot,
    fname: fname || "test",
    body: noteBody,
  });
};

const NOTES = {
  PARAGRAPHS: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      return runGetNoteBlocks({
        engine,
        wsRoot,
        vaults,
        cb: ({ data }) => {
          return [
            {
              actual: data?.length,
              expected: 3,
            },
          ];
        },
      });
    },
    {
      preSetupHook: (opts) =>
        preSetupHook(opts, {
          noteBody: [
            "Et et quam culpa.",
            "",
            "Cumque molestiae qui deleniti.",
            "Eius odit commodi harum.",
            "",
            "Sequi ut non delectus tempore.",
          ].join("\n"),
        }),
    }
  ),
  LIST: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      return runGetNoteBlocks({
        engine,
        wsRoot,
        vaults,
        cb: ({ data }) => {
          return [
            {
              actual: data?.length,
              expected: 5,
            },
          ];
        },
      });
    },
    {
      preSetupHook: (opts) =>
        preSetupHook(opts, {
          noteBody: [
            "Et et quam culpa.",
            "",
            "* Cumque molestiae qui deleniti.",
            "* Eius odit commodi harum.",
            "",
            "Sequi ut non delectus tempore.",
          ].join("\n"),
        }),
    }
  ),
  NESTED_LIST: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      return runGetNoteBlocks({
        engine,
        wsRoot,
        vaults,
        cb: ({ data }) => {
          return [
            {
              actual: data?.length,
              expected: 8,
            },
          ];
        },
      });
    },
    {
      preSetupHook: (opts) =>
        preSetupHook(opts, {
          noteBody: [
            "Et et quam culpa.",
            "",
            "* Cumque molestiae qui deleniti.",
            "* Eius odit commodi harum.",
            "  * Sequi ut non delectus tempore.",
            "  * In delectus quam sunt unde.",
            "* Quasi ex debitis aut sed.",
            "",
            "Perferendis officiis ut non.",
          ].join("\n"),
        }),
    }
  ),
  TABLE: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      return runGetNoteBlocks({
        engine,
        wsRoot,
        vaults,
        cb: ({ data }) => {
          return [
            {
              actual: data?.length,
              expected: 3,
            },
          ];
        },
      });
    },
    {
      preSetupHook: (opts) =>
        preSetupHook(opts, {
          noteBody: [
            "Et et quam culpa.",
            "",
            "| Sapiente | accusamus |",
            "|----------|-----------|",
            "| Laborum  | libero    |",
            "| Ullam    | optio     |",
            "",
            "Sequi ut non delectus tempore.",
          ].join("\n"),
        }),
    }
  ),
  EXISTING_ANCHORS: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      return runGetNoteBlocks({
        engine,
        wsRoot,
        vaults,
        cb: ({ data }) => {
          return [
            {
              actual: data?.length,
              expected: 7,
            },
            { actual: data![0].anchor?.value, expected: "et-et-quam-culpa" },
            { actual: data![1].anchor?.value, expected: "paragraph" },
            { actual: data![2].anchor?.value, expected: "item1" },
            { actual: data![3].anchor?.value, expected: "item2" },
            { actual: data![4].anchor?.value, expected: "item3" },
            { actual: data![5].anchor?.value, expected: "list" },
            { actual: data![6].anchor?.value, expected: "table" },
          ];
        },
      });
    },
    {
      preSetupHook: (opts) =>
        preSetupHook(opts, {
          noteBody: [
            "# Et et quam culpa. ^header",
            "",
            "Ullam vel eius reiciendis. ^paragraph",
            "",
            "* Cumque molestiae qui deleniti. ^item1",
            "* Eius odit commodi harum. ^item2",
            "  * Sequi ut non delectus tempore. ^item3",
            "",
            "^list",
            "",
            "| Sapiente | accusamus |",
            "|----------|-----------|",
            "| Laborum  | libero    |",
            "| Ullam    | optio     | ^table",
          ].join("\n"),
        }),
    }
  ),
  HEADER: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      return runGetNoteBlocks({
        engine,
        wsRoot,
        vaults,
        cb: ({ data }) => {
          debugger;
          return [
            {
              actual: data?.length,
              expected: 4,
            },
            {
              actual: data![0].anchor?.value,
              expected: "et-et-quam-culpa",
            },
            {
              actual: data![2].anchor?.value,
              expected: "eius-odit-commodi-harum",
            },
          ];
        },
      });
    },
    {
      preSetupHook: (opts) =>
        preSetupHook(opts, {
          noteBody: [
            "# Et et quam culpa. ^anchor",
            "",
            "Cumque molestiae qui deleniti.",
            "",
            "# Eius odit commodi harum.",
            "",
            "Sequi ut non delectus tempore.",
          ].join("\n"),
        }),
    }
  ),
};
export const ENGINE_GET_NOTE_BLOCKS_PRESETS = {
  // use the below to test a specific test
  //NOTES: {NOTE_REF: NOTES["NOTE_REF"]},
  NOTES,
  SCHEMAS: {},
};
