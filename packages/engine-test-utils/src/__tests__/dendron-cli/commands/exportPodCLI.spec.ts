import { ERROR_SEVERITY } from "@dendronhq/common-all";
import { writeYAML } from "@dendronhq/common-server";
import { PodSource, PublishPodCLICommand } from "@dendronhq/dendron-cli";
import path from "path";
import { runEngineTestV5 } from "../../..";

describe("GIVEN export one", () => {
  describe("WHEN enrichPodArgs ", () => {
    describe("AND WHEN config not present", () => {
      it("THEN podArgs are enriched", async () => {
        await runEngineTestV5(
          async ({ wsRoot }) => {
            const cmd = new PublishPodCLICommand();
            const resp = await cmd.enrichArgs({
              wsRoot,
              podId: "dendron.airtable",
              podSource: PodSource.BUILTIN,
            });
            expect(resp.error?.severity).toEqual(ERROR_SEVERITY.FATAL);
            return;
          },
          { expect }
        );
      });
    });

    describe("AND WHEN ---configPath is used", () => {
      it("THEN custom config is used", async () => {
        await runEngineTestV5(
          async ({ wsRoot }) => {
            const configPath = path.join(wsRoot, "custom.yml");
            writeYAML(configPath, {
              vaultName: "fooVault",
            });
            const cmd = new PublishPodCLICommand();
            const resp = await cmd.enrichArgs({
              wsRoot,
              podId: "dendron.airtable",
              podSource: PodSource.BUILTIN,
              configPath,
            });
            expect(resp.data?.config).toEqual({ vaultName: "fooVault" });
            return;
          },
          { expect }
        );
      });
    });

    describe("AND WHEN ---configPath and --query is used", () => {
      it("THEN custom config is used with query", async () => {
        await runEngineTestV5(
          async ({ wsRoot }) => {
            const configPath = path.join(wsRoot, "custom.yml");
            writeYAML(configPath, {
              fname: "foo",
              vaultName: "fooVault",
            });
            const cmd = new PublishPodCLICommand();
            const resp = await cmd.enrichArgs({
              wsRoot,
              podId: "dendron.airtable",
              podSource: PodSource.BUILTIN,
              configPath,
              query: "foo",
            });
            expect(resp.data?.config).toEqual({
              fname: "foo",
              vaultName: "fooVault",
            });
            return;
          },
          { expect }
        );
      });
    });
  });
});
