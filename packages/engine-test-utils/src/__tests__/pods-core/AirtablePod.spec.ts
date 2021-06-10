import { ENGINE_HOOKS } from "../../../../common-test-utils/lib";
import { AirtableExportPod } from "@dendronhq/pods-core";
import { runEngineTestV5 } from "../../engine";

describe("Airtable export pod", () => {
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
