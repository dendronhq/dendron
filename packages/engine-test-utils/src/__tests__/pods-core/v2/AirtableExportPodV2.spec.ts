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
  PodUtils,
  RunnableAirtableV2PodConfig,
  SpecialSrcFieldToKey,
  SrcFieldMapping,
} from "@dendronhq/pods-core";
import _ from "lodash";
import { TestEngineUtils } from "../../..";
import { runEngineTestV5 } from "../../../engine";
import { checkString } from "../../../utils";
import fs from "fs-extra";

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
}: {
  srcFieldMapping: { [key: string]: SrcFieldMapping };
  filters?: ExportPodConfigurationFilterV2;
  cb: (opts: {
    engine: DEngineClient;
    pod: AirtableExportPodV2;
  }) => Promise<AirtableExportReturnType>;
}) => {
  return async (preSetupHook: SetupHookFunction) => {
    let resp: Promise<AirtableExportReturnType>;
    await runEngineTestV5(
      async (opts) => {
        const { engine } = opts;
        const pod = createPod({
          config: {
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
}) => {
  return _setupTestFactoryCommon({
    ...opts,
    cb: async ({ engine, pod }) => {
      const note = TestEngineUtils.getNoteByFname(engine, opts.fname);
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
      const notes = _.values(engine.notes).filter(
        (ent) => !DNodeUtils.isRoot(ent)
      );
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
        configId: "dendron.tasks",
      },
    },
  });

  describe("AND linked note is not already exported", () => {
    test("THEN show error message", async () => {
      const preSetupHook = async (opts: WorkspaceOpts) => {
        await TestEngineUtils.createNoteByFname({
          fname: "task.alpha",
          body: "This is a task",
          ...opts,
        });
        await TestEngineUtils.createNoteByFname({
          fname: "proj.beta",
          body: "[[task.alpha]]",
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

  describe("AND linked note's id is present in metadata file", () => {
    const preSetupHook = async (opts: WorkspaceOpts) => {
      await TestEngineUtils.createNoteByFname({
        fname: "task.alpha",
        body: "This is a task",
        ...opts,
      });
      await TestEngineUtils.createNoteByFname({
        fname: "proj.beta",
        body: "[[task.alpha]]",
        ...opts,
      });
      const filePath = PodUtils.getPodMetadataJsonFilePath({
        wsRoot: opts.wsRoot,
        vault: opts.vaults[0],
        podId: "dendron.tasks",
      });
      const metadata = [
        { dendronId: "task.alpha", airtableId: "airtableId-task" },
      ];
      await fs.writeFile(filePath, JSON.stringify(metadata, null, 2));
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

// Testing backward compatability
describe("WHEN metadata file does not have airtableId", () => {
  let resp: AirtableExportReturnType;

  const setupTest = setupTestFactoryForNote({
    fname: "alpha",
    srcFieldMapping: {
      Tasks: {
        type: "multiSelect",
        to: "multi",
      },
    },
  });

  describe("AND note does not have airtableId in frontmatter", () => {
    test("THEN create new record in Airtable", async () => {
      const preSetupHook = async (opts: WorkspaceOpts) => {
        await TestEngineUtils.createNoteByFname({
          fname: "alpha",
          body: "This is a task",
          custom: {
            multi: ["one", "two"],
          },
          ...opts,
        });
      };
      const resp = await setupTest(preSetupHook);
      expect(resp).toEqual({
        data: {
          created: [
            {
              fields: {
                DendronId: "alpha",
                Tasks: ["one", "two"],
              },
              id: "airtable-alpha",
            },
          ],
          updated: [],
        },
        error: null,
      });
    });
  });

  describe("AND note has airtableId in frontmatter", () => {
    const preSetupHook = async (opts: WorkspaceOpts) => {
      await TestEngineUtils.createNoteByFname({
        fname: "alpha",
        body: "This is a task",
        custom: { airtableId: "airtableId-alpha", multi: ["one", "two"] },
        ...opts,
      });
    };
    beforeAll(async () => {
      resp = await setupTest(preSetupHook);
    });

    test("THEN update the record", () => {
      expect(resp).toEqual({
        data: {
          created: [],
          updated: [
            {
              fields: {
                DendronId: "alpha",
                Tasks: ["one", "two"],
              },
              id: "airtable-alpha",
            },
          ],
        },
        error: null,
      });
    });
  });
});
