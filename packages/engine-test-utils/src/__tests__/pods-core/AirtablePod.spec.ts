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
import { AirtableExportPod } from "@dendronhq/pods-core";
import fs from "fs-extra";
import path from "path";
import sinon from "sinon";
import { runEngineTestV5 } from "../../engine";
import { ENGINE_HOOKS } from "../../presets";

const runExport = (opts: WorkspaceOpts & { engine: DEngineClient }) => {
  const pod = new AirtableExportPod();
  const srcHierarchy = "foo";
  return pod.execute({
    ...opts,
    config: {
      dest: "TODO",
      apiKey: "fakeKey",
      baseId: "fakeBase",
      tableName: "fakeTable",
      srcFieldMapping: {
        Title: "title",
        "Updated On": "updated",
        Notes: "body",
      },
      srcHierarchy,
    },
  });
};
const createAxiosError = ({
  response,
}: {
  response?: Partial<AxiosError["response"]>;
}) => {
  let err: AxiosError = {
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

describe("GIVEN airtable export", () => {
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
            await runExport(opts);
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
            await runExport(opts);
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
          return await pods.execute({
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
