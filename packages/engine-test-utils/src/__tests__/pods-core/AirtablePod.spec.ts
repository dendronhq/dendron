import {
  axios,
  AxiosError,
  DendronError,
  DEngineClient,
  ErrorUtils,
  StatusCodes,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import {
  AirtableExportPod,
  AirtableExportResp,
  AirtableFieldsMap,
  AirtableUtils,
  SrcFieldMapping,
} from "@dendronhq/pods-core";
import _ from "lodash";
import sinon from "sinon";
import { runEngineTestV5 } from "../../engine";
import { ENGINE_HOOKS } from "../../presets";

// --- Helpers

const createNotePresetsHelper = async (opts: WorkspaceOpts) => {
  const { wsRoot } = opts;
  const vault = opts.vaults[0];
  const props = [
    {
      fname: "foo.lvl-1",
      vault,
      wsRoot,
      props: { tags: ["lvl1", "source.one"] },
    },
    {
      fname: "foo.lvl-2",
      vault,
      wsRoot,
      props: { tags: ["lvl2", "source.two"] },
    },
    {
      fname: "foo.no-level",
      vault,
      wsRoot,
      props: { tags: ["source.three"] },
    },
  ];
  return props;
};

const createNotePresetsWithAllCreate = async (opts: WorkspaceOpts) => {
  const noteprops = await createNotePresetsHelper(opts);
  return Promise.all(
    noteprops.map((ent) => {
      return NoteTestUtilsV4.createNote(ent);
    })
  );
};

const createNotePresetsWithAllUpdate = async (opts: WorkspaceOpts) => {
  const noteprops = await createNotePresetsHelper(opts);
  return Promise.all(
    noteprops.map((ent) => {
      ent = _.merge(ent, { custom: { airtableId: "airtableId" } });
      return NoteTestUtilsV4.createNote(ent);
    })
  );
};

const stubAirtableCalls = () => {
  const chunkFake = sinon.fake((allRecords: AirtableFieldsMap[]) => {
    // add airtable id
    return _.map(allRecords, (ent) => {
      return {
        ...ent,
        id: "airtable-" + ent.fields["DendronId"],
      };
    });
  });
  sinon.replace(AirtableUtils, "chunkAndCall", chunkFake);
};

const runExport = (
  opts: WorkspaceOpts & {
    engine: DEngineClient;
    podConfig: {
      srcFieldMapping: { [key: string]: SrcFieldMapping };
      srcHierarchy: string;
    };
  }
) => {
  const pod = new AirtableExportPod();
  return pod.execute({
    ...opts,
    config: {
      dest: "TODO",
      apiKey: "fakeKey",
      baseId: "fakeBase",
      tableName: "fakeTable",
      ...opts.podConfig,
    },
  }) as Promise<AirtableExportResp>;
};

const runExportPreset = (
  opts: WorkspaceOpts & {
    engine: DEngineClient;
    srcFieldMapping?: { [key: string]: SrcFieldMapping };
  }
) => {
  const pod = new AirtableExportPod();
  const srcHierarchy = "foo";
  return pod.execute({
    ...opts,
    config: {
      dest: "TODO",
      apiKey: "fakeKey",
      baseId: "fakeBase",
      tableName: "fakeTable",
      srcFieldMapping: _.merge(
        {
          Title: "title",
          "Updated On": "updated",
          Notes: "body",
        },
        opts.srcFieldMapping
      ),
      srcHierarchy,
    },
  });
};

const createAxiosError = ({
  response,
}: {
  response?: Partial<AxiosError["response"]>;
}) => {
  const err: AxiosError = {
    isAxiosError: true,
    config: {},
    // @ts-ignore
    response,
    message: "error",
    name: "error",
    toJSON: () => {
      return {};
    },
  };
  return err;
};

// --- Main

describe("WHEN airtable export", () => {
  afterEach(() => {
    sinon.restore();
  });

  describe("WHEN create new notes", () => {
    const preSetupHook = createNotePresetsWithAllCreate;

    describe("AND WHEN export notes with one singleTag", () => {
      test("THEN success", async () => {
        await runEngineTestV5(
          async (opts) => {
            stubAirtableCalls();
            const { data } = await runExport({
              ...opts,
              podConfig: {
                srcFieldMapping: {
                  Level: { type: "singleTag", filter: "tags.lvl*" },
                },
                srcHierarchy: "foo",
              },
            });
            expect(data).toMatchSnapshot();
            // only two entries with level created
            expect(
              _.filter(data.created, (ent) => ent.fields["Level"]).length
            ).toEqual(2);
            expect(data.updated.length).toEqual(0);
          },
          {
            expect,
            preSetupHook,
          }
        );
      });
    });

    describe("AND WHEN export notes with multiple singleTag", () => {
      test("THEN success", async () => {
        await runEngineTestV5(
          async (opts) => {
            const chunkFake = sinon.fake((allRecords: AirtableFieldsMap[]) => {
              // add airtable id
              return _.map(allRecords, (ent) => {
                return {
                  ...ent,
                  id: "airtable-" + ent.fields["DendronId"],
                };
              });
            });
            sinon.replace(AirtableUtils, "chunkAndCall", chunkFake);
            const { data } = await runExport({
              ...opts,
              podConfig: {
                srcFieldMapping: {
                  Level: { type: "singleTag", filter: "tags.lvl*" },
                  Source: { type: "singleTag", filter: "tags.source.*" },
                },
                srcHierarchy: "foo",
              },
            });
            expect(data).toMatchSnapshot();
            // only two entries with level created
            expect(
              _.filter(data.created, (ent) => ent.fields["Level"]).length
            ).toEqual(2);
            // three entries with source
            expect(
              _.filter(data.created, (ent) => ent.fields["Source"]).length
            ).toEqual(3);
            expect(data.updated.length).toEqual(0);
          },
          {
            expect,
            preSetupHook,
          }
        );
      });
    });
  });

  describe("WHEN update notes", () => {
    const preSetupHook = createNotePresetsWithAllUpdate;
    describe("AND WHEN export notes with one singleTag", () => {
      test("THEN success", async () => {
        await runEngineTestV5(
          async (opts) => {
            stubAirtableCalls();
            const { data } = await runExport({
              ...opts,
              podConfig: {
                srcFieldMapping: {
                  Level: { type: "singleTag", filter: "tags.lvl*" },
                },
                srcHierarchy: "foo",
              },
            });
            expect(data).toMatchSnapshot();
            // only two entries with level created
            expect(
              _.filter(data.updated, (ent) => ent.fields["Level"]).length
            ).toEqual(2);
            expect(data.created.length).toEqual(0);
          },
          {
            expect,
            preSetupHook,
          }
        );
      });
    });

    describe("AND WHEN export notes with multiple singleTag", () => {
      test("THEN success", async () => {
        await runEngineTestV5(
          async (opts) => {
            const chunkFake = sinon.fake((allRecords: AirtableFieldsMap[]) => {
              // add airtable id
              return _.map(allRecords, (ent) => {
                return {
                  ...ent,
                  id: "airtable-" + ent.fields["DendronId"],
                };
              });
            });
            sinon.replace(AirtableUtils, "chunkAndCall", chunkFake);
            const { data } = await runExport({
              ...opts,
              podConfig: {
                srcFieldMapping: {
                  Level: { type: "singleTag", filter: "tags.lvl*" },
                  Source: { type: "singleTag", filter: "tags.source.*" },
                },
                srcHierarchy: "foo",
              },
            });
            expect(data).toMatchSnapshot();
            // only two entries with level created
            expect(
              _.filter(data.updated, (ent) => ent.fields["Level"]).length
            ).toEqual(2);
            // three entries with source
            expect(
              _.filter(data.updated, (ent) => ent.fields["Source"]).length
            ).toEqual(3);
            expect(data.created.length).toEqual(0);
          },
          {
            expect,
            preSetupHook,
          }
        );
      });
    });
  });

  describe("WHEN error from post", () => {
    afterEach(() => {
      sinon.restore();
    });
    test("THEN throw error", async () => {
      await runEngineTestV5(
        async (opts) => {
          try {
            sinon
              .stub(axios, "post")
              .rejects(new DendronError({ message: "foo" }));
            await runExportPreset(opts);
          } catch (err) {
            expect(ErrorUtils.isDendronError(err)).toBeTruthy();
          }
        },
        {
          expect,
          preSetupHook: ENGINE_HOOKS.setupBasic,
        }
      );
    });
  });

  describe.skip("WHEN bad field mapping", () => {
    beforeEach(() => {
      sinon.reset();
    });
    afterEach(() => {
      sinon.restore();
    });

    test("THEN throw detailed error", async () => {
      await runEngineTestV5(
        async (opts) => {
          try {
            const err = createAxiosError({
              response: {
                //
                data: {
                  type: "UNKNOWN_FIELD_NAME",
                  message: 'Unknown field name: "Title"',
                },
                status: StatusCodes.UNPROCESSABLE_ENTITY,
              },
            });
            sinon.stub(axios, "post").rejects(err);
            await runExportPreset(opts);
          } catch (err) {
            expect(ErrorUtils.isDendronError(err)).toBeTruthy();
            expect((err as DendronError).message).toEqual(
              'Unknown field name: "Title"'
            );
          }
        },
        {
          expect,
          preSetupHook: ENGINE_HOOKS.setupBasic,
        }
      );
    });
  });
});
