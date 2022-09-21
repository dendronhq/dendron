import {
  DEngineClient,
  DNodeUtils,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import { SetupHookFunction } from "@dendronhq/common-test-utils";
import {
  AirtableExportPodV2,
  AirtableExportReturnType,
  AirtableFieldsMap,
  ExportPodConfigurationFilterV2,
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
    podId: "test",
    apiKey: "fakeKey",
    baseId: "fakeBase",
    tableName: "fakeTable",
    exportScope: PodExportScope.Note,
    sourceFieldMapping: {},
    filters: {
      fname: [],
    },
  };
  _.merge(cleanConfig, config);
  return new AirtableExportPodV2({
    airtable: fakeAirtable,
    config: cleanConfig,
    engine,
  });
}

const createTestNote = (opts: WorkspaceOpts, custom: any = {}) => {
  return TestEngineUtils.createNoteByFname({
    fname: "alpha",
    body: "",
    custom,
    ...opts,
  });
};

const genField = (opts: any = {}) => {
  return {
    fields: {
      DendronId: "alpha",
      ...opts,
    },
    id: "airtable-alpha",
  };
};

const _setupTestFactoryCommon = ({
  srcFieldMapping,
  filters,
  cb,
  podId,
}: {
  srcFieldMapping: { [key: string]: SrcFieldMapping };
  filters?: ExportPodConfigurationFilterV2;
  cb: (opts: {
    engine: DEngineClient;
    pod: AirtableExportPodV2;
  }) => Promise<AirtableExportReturnType>;
  podId?: string;
}) => {
  return async (preSetupHook: SetupHookFunction) => {
    let resp: Promise<AirtableExportReturnType>;
    await runEngineTestV5(
      async (opts) => {
        const { engine } = opts;
        const pod = createPod({
          config: {
            podId,
            filters,
            sourceFieldMapping: {
              DendronId: {
                type: "string",
                to: "id",
              },
              // Useful for debugging when snapshot tests are turned on
              // Fname: {
              //   type: "string",
              //   to: "fname",
              // },
              ...srcFieldMapping,
            },
          },
          engine: opts.engine,
        });
        resp = cb({ engine, pod });
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

const setupTestFactoryForNote = (opts: {
  srcFieldMapping: { [key: string]: SrcFieldMapping };
  filters?: ExportPodConfigurationFilterV2;
  fname: string;
  podId?: string;
}) => {
  return _setupTestFactoryCommon({
    ...opts,
    cb: async ({ engine, pod }) => {
      const note = (
        await engine.findNotes({
          fname: opts.fname,
          vault: engine.vaults[0],
        })
      )[0];
      return pod.exportNotes([note!]);
    },
  });
};

const setupTestFactoryForNotes = (opts: {
  srcFieldMapping: { [key: string]: SrcFieldMapping };
  filters?: ExportPodConfigurationFilterV2;
}) => {
  return _setupTestFactoryCommon({
    ...opts,
    cb: async ({ engine, pod }) => {
      const engineNotes = await engine.findNotes({
        excludeStub: false,
      });
      const notes = engineNotes.filter((ent) => !DNodeUtils.isRoot(ent));
      return pod.exportNotes(notes);
    },
  });
};

describe("WHEN export hierarchy", () => {
  describe("AND WHEN filters", () => {
    const preSetupHook = async (opts: WorkspaceOpts) => {
      return Promise.all(
        ["alpha.one", "alpha.two", "alpha.three", "alpha.one.uno"].map(
          (fname) =>
            TestEngineUtils.createNoteByFname({
              fname,
              body: "",
              ...opts,
            })
        )
      );
    };

    describe("AND WHEN filter is single fname", () => {
      const setupTest = setupTestFactoryForNotes({
        srcFieldMapping: {},
        filters: {
          fname: ["alpha"],
        },
      });
      test("THEN filtered note exported", async () => {
        const resp = await setupTest(preSetupHook);
        expect(
          resp.data?.created?.map(({ fields }) => fields.DendronId).sort()
        ).toEqual(["alpha.one", "alpha.one.uno", "alpha.three", "alpha.two"]);
      });
    });

    describe("AND WHEN filter has glob pattern", () => {
      const setupTest = setupTestFactoryForNotes({
        srcFieldMapping: {},
        filters: {
          fname: ["alpha.on*", "alpha"],
        },
      });
      test("THEN filtered note exported", async () => {
        const resp = await setupTest(preSetupHook);
        expect(
          resp.data?.created?.map(({ fields }) => fields.DendronId).sort()
        ).toEqual(["alpha.three", "alpha.two"]);
      });
    });
  });
});

describe("WHEN export number", () => {
  describe("AND WHEN number is required", () => {
    const setupTest = setupTestFactoryForNote({
      fname: "alpha",
      srcFieldMapping: {
        Alpha: {
          type: "number",
          to: "custom.alpha",
          required: true,
        },
      },
    });

    describe("AND WHEN field is absent", () => {
      const preSetupHook = async (opts: WorkspaceOpts) => {
        return createTestNote(opts, {});
      };

      test("THEN return error", async () => {
        const resp = await setupTest(preSetupHook);
        expect(resp).toMatchSnapshot();
        expect(resp.data).toEqual({});
      });
    });
  });

  describe("AND WHEN number is not required", () => {
    const setupTest = setupTestFactoryForNote({
      fname: "alpha",
      srcFieldMapping: {
        Alpha: {
          type: "number",
          to: "custom.alpha",
        },
      },
    });

    describe("AND WHEN number is present", () => {
      const preSetupHook = async (opts: WorkspaceOpts) => {
        return createTestNote(opts, { alpha: 1 });
      };
      test("THEN export number", async () => {
        const resp = await setupTest(preSetupHook);
        expect(resp).toMatchSnapshot();
        expect(resp.data?.created).toEqual([genField({ Alpha: 1 })]);
      });
    });

    describe("AND WHEN field is absent", () => {
      const preSetupHook = async (opts: WorkspaceOpts) => {
        return createTestNote(opts, {});
      };
      test("THEN do not export number", async () => {
        const resp = await setupTest(preSetupHook);
        expect(resp).toMatchSnapshot();
        expect(resp.data?.created).toEqual([genField()]);
      });
    });
  });
});

describe("WHEN export checkbox", () => {
  const setupTest = setupTestFactoryForNote({
    fname: "alpha",
    srcFieldMapping: {
      Alpha: {
        type: "boolean",
        to: "custom.alpha",
      },
    },
  });

  describe("AND WHEN checkbox is true", () => {
    const preSetupHook = async (opts: WorkspaceOpts) => {
      return createTestNote(opts, { alpha: true });
    };

    test("THEN chekbox set tot rue", async () => {
      const resp = await setupTest(preSetupHook);
      expect(resp).toMatchSnapshot();
      expect(resp.data?.created).toEqual([genField({ Alpha: true })]);
    });
  });

  describe("AND WHEN checkbox is false", () => {
    const preSetupHook = async (opts: WorkspaceOpts) => {
      await TestEngineUtils.createNoteByFname({
        fname: "alpha",
        body: "",
        custom: {
          alpha: false,
        },
        ...opts,
      });
    };
    test("THEN chekbox set tot rue", async () => {
      const resp = await setupTest(preSetupHook);
      expect(resp).toMatchSnapshot();
      expect(resp.data?.created).toEqual([
        {
          fields: {
            DendronId: "alpha",
            Alpha: false,
          },
          id: "airtable-alpha",
        },
      ]);
    });
  });
});

describe("WHEN export note with singleSelect ", () => {
  describe("AND GIVEN singleSelect is regular fm field", () => {
    const setupTest = setupTestFactoryForNote({
      fname: "alpha",
      srcFieldMapping: {
        Tasks: {
          type: "singleSelect",
          to: "single",
        },
      },
    });

    describe("AND WHEN value is filled", () => {
      const preSetupHook = async (opts: WorkspaceOpts) => {
        return createTestNote(opts, { single: "one" });
      };
      test("THEN field is exported ", async () => {
        const resp = await setupTest(preSetupHook);
        expect(resp).toMatchSnapshot();
        expect(resp.data?.created).toEqual([genField({ Tasks: "one" })]);
      });
    });

    describe("AND WHEN value is empty", () => {
      const preSetupHook = async (opts: WorkspaceOpts) => {
        return createTestNote(opts);
      };
      test("THEN field is not exported", async () => {
        const resp = await setupTest(preSetupHook);
        expect(resp).toMatchSnapshot();
        expect(resp.data?.created).toEqual([genField()]);
      });
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
      const setupTest = setupTestFactoryForNote({
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
      const setupTest = setupTestFactoryForNote({
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
        expect(resp.data?.created).toEqual([genField({ Tasks: "action.baz" })]);
      });
    });

    describe("AND no matching tags for singleSelect", () => {
      const setupTest = setupTestFactoryForNote({
        fname: "alpha",
        srcFieldMapping: {
          Tasks: {
            type: "singleSelect",
            to: SpecialSrcFieldToKey.TAGS,
            filter: "tags.gamma.*",
          },
        },
      });

      test("THEN field is exported ", async () => {
        const resp = await setupTest(preSetupHook);
        expect(resp).toMatchSnapshot();
        expect(resp.data?.created).toEqual([genField({})]);
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
    const setupTest = setupTestFactoryForNote({
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
    const setupTest = setupTestFactoryForNote({
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

  const setupTest = setupTestFactoryForNote({
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

describe("GIVEN export note with date ", () => {
  describe("WHEN skipOnEmpty is not defined/true", () => {
    const setupTest = setupTestFactoryForNote({
      fname: "alpha",
      srcFieldMapping: {
        Tasks: {
          type: "date",
          to: "endDate",
        },
      },
    });

    describe("AND WHEN value is empty", () => {
      const preSetupHook = async (opts: WorkspaceOpts) => {
        return createTestNote(opts, { endDate: "" });
      };
      test("THEN field is skipped and no error is thrown", async () => {
        const resp = await setupTest(preSetupHook);
        expect(resp.data?.created).toEqual([genField()]);
      });
    });
    describe("AND WHEN value is present", () => {
      const preSetupHook = async (opts: WorkspaceOpts) => {
        return createTestNote(opts, { endDate: "2022-03-05" });
      };
      test("THEN field is exported with value", async () => {
        const resp = await setupTest(preSetupHook);
        expect(resp.data?.created).toEqual([genField({ Tasks: "2022-03-05" })]);
      });
    });
  });
  describe("AND WHEN skipOnEmpty is set to false", () => {
    const setupTest = setupTestFactoryForNote({
      fname: "alpha",
      srcFieldMapping: {
        Tasks: {
          type: "date",
          to: "endDate",
          skipOnEmpty: false,
        },
      },
    });

    describe("AND WHEN value is empty", () => {
      const preSetupHook = async (opts: WorkspaceOpts) => {
        return createTestNote(opts, { endDate: "" });
      };
      test("THEN error is thrown", async () => {
        const resp = await setupTest(preSetupHook);
        expect(resp.error?.message).toEqual(
          "The value for endDate is found empty. Please provide a valid value or enable skipOnEmpty in the srcFieldMapping."
        );
      });
    });
  });
});

describe("GIVEN note has pods namespace in frontmatter", () => {
  describe("WHEN export note with linked record", () => {
    let resp: AirtableExportReturnType;

    const setupTest = setupTestFactoryForNote({
      fname: "proj.beta",
      srcFieldMapping: {
        Tasks: {
          type: "linkedRecord",
          to: "links",
          podId: "dendron.task",
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
          custom: { pods: { airtable: { "dendron.task": "airtableId-task" } } },
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
    describe("AND linked note is associated with multiple records", () => {
      const preSetupHook = async (opts: WorkspaceOpts) => {
        await TestEngineUtils.createNoteByFname({
          fname: "task.alpha",
          body: "This is a task",
          custom: { pods: { airtable: { "dendron.task": "airtableId-task" } } },
          ...opts,
        });
        await TestEngineUtils.createNoteByFname({
          fname: "task.beta",
          body: "This is a task beta",
          custom: {
            pods: {
              airtable: {
                "dendron.feat": "airtableId-feat",
                "dendron.task": "airtableId-task2",
              },
            },
          },
          ...opts,
        });
        await TestEngineUtils.createNoteByFname({
          fname: "proj.beta",
          body: "[[task.alpha]] [[task.beta]]",
          custom: {},
          ...opts,
        });
      };

      beforeAll(async () => {
        resp = await setupTest(preSetupHook);
      });

      test("THEN create new record for the tasks with matching podId", () => {
        expect(resp.data?.created).toEqual([
          {
            fields: {
              DendronId: "proj.beta",
              Tasks: ["airtableId-task", "airtableId-task2"],
            },
            id: "airtable-proj.beta",
          },
        ]);
      });
    });
  });
  describe("WHEN export a note", () => {
    const setupTest = setupTestFactoryForNote({
      podId: "dendron.task",
      fname: "alpha",
      srcFieldMapping: {
        Alpha: {
          type: "number",
          to: "custom.alpha",
        },
      },
    });

    describe("AND airtable id is present in frontmatter under pods namespace", () => {
      const preSetupHook = async (opts: WorkspaceOpts) => {
        return createTestNote(opts, {
          alpha: 1,
          pods: { airtable: { "dendron.task": "airtable-one" } },
        });
      };
      test("THEN update the record", async () => {
        const resp = await setupTest(preSetupHook);
        expect(resp.data?.updated).toEqual([genField({ Alpha: 1 })]);
      });
    });
    describe("AND airtable id is not present in frontmatter under pods namespace", () => {
      const preSetupHook = async (opts: WorkspaceOpts) => {
        return createTestNote(opts, { alpha: 1 });
      };
      test("THEN create the record", async () => {
        const resp = await setupTest(preSetupHook);
        expect(resp.data?.created).toEqual([genField({ Alpha: 1 })]);
      });
    });
  });
});
