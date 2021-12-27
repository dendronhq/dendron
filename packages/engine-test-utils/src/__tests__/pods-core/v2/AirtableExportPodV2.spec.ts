import { DEngineClient, WorkspaceOpts } from "@dendronhq/common-all";
import { SetupHookFunction } from "@dendronhq/common-test-utils";
import {
  AirtableExportPodV2,
  AirtableExportReturnType,
  AirtableFieldsMap,
  PodExportScope,
  RunnableAirtableV2PodConfig,
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

describe("WHEN export note with linked record", () => {
  let resp: AirtableExportReturnType;

  const setupTest = async (preSetupHook: SetupHookFunction) => {
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
              Tasks: {
                type: "linkedRecord",
                to: "links",
                filter: "task.*",
              },
            },
          },
          engine: opts.engine,
        });
        const note = TestEngineUtils.getNoteByFname(engine, "proj.beta");
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

  describe.skip("AND linked note does not exist", () => {});

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
