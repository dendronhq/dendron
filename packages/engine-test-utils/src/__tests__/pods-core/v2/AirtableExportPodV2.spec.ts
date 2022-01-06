import { DEngineClient, WorkspaceOpts } from "@dendronhq/common-all";
import { SetupHookFunction } from "@dendronhq/common-test-utils";
import {
  AirtableExportPodV2,
  AirtableExportReturnType,
  AirtableFieldsMap,
  PodExportScope,
  RunnableAirtableV2PodConfig,
  SpecialSrcFieldToKey,
  SrcFieldMapping,
} from "@dendronhq/pods-core";
import _ from "lodash";
import { TestEngineUtils } from "../../..";
import { runEngineTestV5 } from "../../../engine";
import { checkString } from "../../../utils";

const FakeAirtableBase = () => ({
  create: (allRecords: AirtableFieldsMap[]) => {
    return _.map(allRecords, (ent) => {
      return {
        ...ent,
        id: "airtable-" + ent.fields["DendronId"],
      };
    });
  },
  update: (allRecords: AirtableFieldsMap[]) => {
    return _.map(allRecords, (ent) => {
      return {
        ...ent,
        id: "airtable-" + ent.fields["DendronId"],
      };
    });
  },
});

function createPod({
  config,
  engine,
}: {
  config: Partial<RunnableAirtableV2PodConfig>;
  engine: DEngineClient;
}) {
  const fakeAirtable = {
    base: () => FakeAirtableBase,
  } as any;
  const cleanConfig: RunnableAirtableV2PodConfig = {
    apiKey: "fakeKey",
    baseId: "fakeBase",
    tableName: "fakeTable",
    exportScope: PodExportScope.Note,
    sourceFieldMapping: {},
  };
  _.merge(cleanConfig, config);
  return new AirtableExportPodV2({
    airtable: fakeAirtable,
    config: cleanConfig,
    engine,
  });
}

const setupTestFactory = ({
  srcFieldMapping,
  fname,
}: {
  srcFieldMapping: { [key: string]: SrcFieldMapping };
  fname: string;
}) => {
  return async (preSetupHook: SetupHookFunction) => {
    let resp: AirtableExportReturnType;
    await runEngineTestV5(
      async (opts) => {
        const { engine } = opts;
        const pod = createPod({
          config: {
            sourceFieldMapping: {
              DendronId: {
                type: "string",
                to: "id",
              },
              ...srcFieldMapping,
            },
          },
          engine: opts.engine,
        });
        const note = TestEngineUtils.getNoteByFname(engine, fname);
        resp = await pod.exportNote(note!);
      },
      {
        expect,
        preSetupHook,
      }
    );
    // @ts-ignore;
    return resp;
  };
};

describe("WHEN export note with singleSelect ", () => {
  describe("AND GIVEN singleSelect is regular fm field", () => {
    const preSetupHook = async (opts: WorkspaceOpts) => {
      await TestEngineUtils.createNoteByFname({
        fname: "alpha",
        body: "",
        custom: {
          single: "one",
        },
        ...opts,
      });
    };
    const setupTest = setupTestFactory({
      fname: "alpha",
      srcFieldMapping: {
        Tasks: {
          type: "singleSelect",
          to: "single",
        },
      },
    });
    test("THEN field is exported ", async () => {
      const resp = await setupTest(preSetupHook);
      expect(resp).toMatchSnapshot();
      expect(resp.data?.created).toEqual([
        {
          fields: {
            DendronId: "alpha",
            Tasks: "one",
          },
          id: "airtable-alpha",
        },
      ]);
    });
  });

  describe("AND GIVEN singleSelect is a tag ", () => {
    const preSetupHook = async (opts: WorkspaceOpts) => {
      await TestEngineUtils.createNoteByFname({
        fname: "alpha",
        body: "#role.foo #role.bar #action.baz",
        ...opts,
      });
    };

    describe("AND multiple matching tags for singleSelect", () => {
      const setupTest = setupTestFactory({
        fname: "alpha",
        srcFieldMapping: {
          Tasks: {
            type: "singleSelect",
            to: SpecialSrcFieldToKey.TAGS,
            filter: "tags.role.*",
          },
        },
      });

      test("THEN error is throw ", async () => {
        const resp = await setupTest(preSetupHook);
        await checkString(
          resp.error!.message,
          "singleTag field has multiple values. note: alpha, tags: #role.foo, #role.bar"
        );
      });
    });

    describe("AND single matching tags for singleSelect", () => {
      const setupTest = setupTestFactory({
        fname: "alpha",
        srcFieldMapping: {
          Tasks: {
            type: "singleSelect",
            to: SpecialSrcFieldToKey.TAGS,
            filter: "tags.action.*",
          },
        },
      });

      test("THEN field is exported ", async () => {
        const resp = await setupTest(preSetupHook);
        expect(resp).toMatchSnapshot();
        expect(resp.data?.created).toEqual([
          {
            fields: {
              DendronId: "alpha",
              Tasks: "action.baz",
            },
            id: "airtable-alpha",
          },
        ]);
      });
    });
  });
});

describe("WHEN export note with multi select", () => {
  describe("AND GIVEN multiSelect is regular fm field", () => {
    const preSetupHook = async (opts: WorkspaceOpts) => {
      await TestEngineUtils.createNoteByFname({
        fname: "alpha",
        body: "",
        custom: {
          multi: ["one", "two"],
        },
        ...opts,
      });
    };
    const setupTest = setupTestFactory({
      fname: "alpha",
      srcFieldMapping: {
        Tasks: {
          type: "multiSelect",
          to: "multi",
        },
      },
    });
    test("THEN fields are exported ", async () => {
      const resp = await setupTest(preSetupHook);
      expect(resp).toMatchSnapshot();
      expect(resp.data?.created).toEqual([
        {
          fields: {
            DendronId: "alpha",
            Tasks: ["one", "two"],
          },
          id: "airtable-alpha",
        },
      ]);
    });
  });

  describe("AND GIVEN multiSelect is a tag ", () => {
    const preSetupHook = async (opts: WorkspaceOpts) => {
      await TestEngineUtils.createNoteByFname({
        fname: "alpha",
        body: "#role.foo #role.bar #action.baz",
        ...opts,
      });
    };
    const setupTest = setupTestFactory({
      fname: "alpha",
      srcFieldMapping: {
        Tasks: {
          type: "multiSelect",
          to: SpecialSrcFieldToKey.TAGS,
          filter: "tags.role.*",
        },
      },
    });

    test("THEN tags are exported ", async () => {
      const resp = await setupTest(preSetupHook);
      expect(resp).toMatchSnapshot();
      expect(resp.data?.created).toEqual([
        {
          fields: {
            DendronId: "alpha",
            Tasks: ["role.foo", "role.bar"],
          },
          id: "airtable-alpha",
        },
      ]);
    });
  });
});

describe("WHEN export note with linked record", () => {
  let resp: AirtableExportReturnType;

  const setupTest = setupTestFactory({
    fname: "proj.beta",
    srcFieldMapping: {
      Tasks: {
        type: "linkedRecord",
        to: "links",
        filter: "task.*",
      },
    },
  });

  describe("AND linked note does not have airtable id", () => {
    test("THEN show error message", async () => {
      const preSetupHook = async (opts: WorkspaceOpts) => {
        await TestEngineUtils.createNoteByFname({
          fname: "task.alpha",
          body: "This is a task",
          custom: {},
          ...opts,
        });
        await TestEngineUtils.createNoteByFname({
          fname: "proj.beta",
          body: "[[task.alpha]]",
          custom: {},
          ...opts,
        });
      };
      const resp = await setupTest(preSetupHook);
      await checkString(
        resp.error!.message,
        "The following notes are missing airtable ids: dendron://vault1/task.alpha (task.alpha)"
      );
    });
  });

  describe("AND linked note has airtable id", () => {
    const preSetupHook = async (opts: WorkspaceOpts) => {
      await TestEngineUtils.createNoteByFname({
        fname: "task.alpha",
        body: "This is a task",
        custom: { airtableId: "airtableId-task" },
        ...opts,
      });
      await TestEngineUtils.createNoteByFname({
        fname: "proj.beta",
        body: "[[task.alpha]]",
        custom: {},
        ...opts,
      });
    };

    beforeAll(async () => {
      resp = await setupTest(preSetupHook);
    });

    test("THEN create new record with task as foreign id", () => {
      expect(resp).toEqual({
        data: {
          created: [
            {
              fields: {
                DendronId: "proj.beta",
                Tasks: ["airtableId-task"],
              },
              id: "airtable-proj.beta",
            },
          ],
          updated: [],
        },
        error: null,
      });
    });
  });
});
