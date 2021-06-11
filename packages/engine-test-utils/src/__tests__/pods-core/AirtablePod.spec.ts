import { ENGINE_HOOKS } from "../../../../common-test-utils/lib";
import { tmpDir } from "@dendronhq/common-server";
import { AirtableExportPod } from "@dendronhq/pods-core";
import { runEngineTestV5 } from "../../engine";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { Time } from "@dendronhq/common-all";

describe("Airtable export pod basic", () => {
  test("basic", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pod = new AirtableExportPod();
        const srcHierarchy = "foo";
        pod.processNote = jest.fn();
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
        expect(pod.processNote).toHaveBeenCalledTimes(1);
      },
      {
        expect,
        preSetupHook: ENGINE_HOOKS.setupBasic,
      }
    );
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
        pod.processNote = jest.fn();
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
        expect(pod.processNote).toHaveBeenCalledTimes(1);
      },
      {
        expect,
        preSetupHook: ENGINE_HOOKS.setupBasic,
      }
    );
  });
});
