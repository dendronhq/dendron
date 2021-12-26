import {
  axios,
  AxiosError,
  DendronError,
  DEngineClient,
  ErrorUtils,
  StatusCodes,
  Time,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import { tmpDir } from "@dendronhq/common-server";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import {
  AirtableExportPod,
  AirtableExportResp,
  AirtableFieldsMap,
  AirtableUtils,
  SrcFieldMapping,
} from "@dendronhq/pods-core";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
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
    describe.only("AND WHEN add linked record", () => {
      describe("AND WHEN no records exists", () => {
        let resp: AirtableExportResp;

        beforeAll(async () => {
          await runEngineTestV5(
            async (opts) => {
              stubAirtableCalls();
              resp = (await runExport({
                ...opts,
                podConfig: {
                  srcFieldMapping: {
                    Project: {
                      type: "linkedRecord",
                      to: "links",
                      filter: "task.*",
                    },
                  },
                  srcHierarchy: "foo",
                },
              })) as AirtableExportResp;
              // expect(data).toMatchSnapshot();
              // // only two entries with level created
              // expect(
              //   _.filter(data.created, (ent) => ent.fields["Level"]).length
              // ).toEqual(2);
              // expect(data.updated.length).toEqual(0);
            },
            {
              expect,
              preSetupHook,
            }
          );
        });

        test("THEN create on record", () => {});
      });
    });

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

describe("checkpointing ", () => {
  let exportDest: string;
  let checkpoint: string;
  let timestamp: number;

  beforeEach(() => {
    exportDest = tmpDir().name;
    const basePath = path.dirname(exportDest);
    checkpoint = path.join(
      basePath,
      "pods",
      "dendron.airtable",
      "airtable-pod.lastupdate",
      "checkpoint.txt"
    );
    fs.ensureDirSync(path.dirname(checkpoint));
  });

  test("checkpointing file with greater timestamp", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pods = new AirtableExportPod();
        const srcHierarchy = "foo";
        pods.processNote = jest.fn();
        timestamp = Time.now().toMillis() + 50000000;
        fs.writeFileSync(checkpoint, timestamp.toString(), {
          encoding: "utf8",
        });

        const resp = async () => {
          return pods.execute({
            engine,
            vaults,
            wsRoot,
            config: {
              dest: exportDest,
              apiKey: "apikey",
              baseId: "baseId",
              tableName: "Dendron",
              srcFieldMapping: {
                Title: "title",
                "Updated On": "updated",
                Notes: "body",
              },
              srcHierarchy,
            },
          });
        };
        expect.assertions(1);
        return expect(resp()).rejects.toEqual(
          Error(
            "No new Records to sync in selected hierarchy. Create new file and then try"
          )
        );
      },
      {
        expect,
        preSetupHook: ENGINE_HOOKS.setupBasic,
      }
    );
  });

  test("checkpointing file with lower timestamp", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pod = new AirtableExportPod();
        const srcHierarchy = "foo";
        timestamp = Time.now().toMillis() - 50000000;
        fs.writeFileSync(checkpoint, timestamp.toString(), {
          encoding: "utf8",
        });
        const stub = sinon
          .stub(pod, "processNote")
          .returns(Promise.resolve({ created: [], updated: [] }));
        const resp = await pod.execute({
          engine,
          vaults,
          wsRoot,
          config: {
            dest: "TODO",
            apiKey: "apikey",
            baseId: "baseId",
            tableName: "Dendron",
            srcFieldMapping: {
              Title: "title",
              "Updated On": "updated",
              Notes: "body",
            },
            srcHierarchy,
          },
        });
        expect(resp.notes).not.toBeNull();
        expect(stub.calledOnce).toBeTruthy();
      },
      {
        expect,
        preSetupHook: ENGINE_HOOKS.setupBasic,
      }
    );
  });
});
