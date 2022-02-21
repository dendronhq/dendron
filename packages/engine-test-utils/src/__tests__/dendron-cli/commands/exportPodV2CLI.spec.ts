import { writeYAML } from "@dendronhq/common-server";
import { ExportPodV2CLICommand } from "@dendronhq/dendron-cli";
import {
  ExternalService,
  PodExportScope,
  PodV2Types,
} from "@dendronhq/pods-core";
import path from "path";
import { runEngineTestV5 } from "../../..";
import fs from "fs-extra";
import { ERROR_SEVERITY, Time } from "@dendronhq/common-all";

/**
 * Export Pod V2
 */

const getCustomConfigPath = (wsRoot: string, podId: string) => {
  const podsDir = path.join(wsRoot, "pods", "custom");
  const configPath = path.join(podsDir, `config.${podId}.yml`);
  fs.ensureDirSync(podsDir);
  return configPath;
};

const getSvcConfigPath = (wsRoot: string, connectionId: string) => {
  const podsDir = path.join(wsRoot, "pods", "service-connections");
  const configPath = path.join(podsDir, `svcconfig.${connectionId}.yml`);
  fs.ensureDirSync(podsDir);
  return configPath;
};

// dendron exportPodV2 --podId  dendron.markdown
describe("GIVEN export pod V2 is run ", () => {
  describe("WHEN enrichPodArgs and --podId is used ", () => {
    test("THEN podArgs are enriched", async () => {
      await runEngineTestV5(
        async ({ wsRoot }) => {
          const podId = "dendron.markdown";
          const configPath = getCustomConfigPath(wsRoot, podId);
          writeYAML(configPath, {
            exportScope: "Workspace",
            podType: PodV2Types.MarkdownExportV2,
            destination: "workspace-exp",
          });
          const cmd = new ExportPodV2CLICommand();
          const resp = await cmd.enrichArgs({
            wsRoot,
            podId,
          });
          expect(resp.data?.config.podType).toEqual(
            PodV2Types.MarkdownExportV2
          );
          expect(resp.data?.config.exportScope).toEqual(
            PodExportScope.Workspace
          );
          return;
        },
        { expect }
      );
    });
  });

  // dendron exportPodV2 --inlineConfig Key=podType,Value=MarkdownExport Key=exportScope,Value=Note Key=destination,Value=note-exp
  describe("WHEN only --inlineConfig is given and exportScope is Note", () => {
    test("THEN podArgs are enriched", async () => {
      await runEngineTestV5(
        async ({ wsRoot }) => {
          const cmd = new ExportPodV2CLICommand();
          const resp = await cmd.enrichArgs({
            wsRoot,
            inlineConfig: [
              "Key=podType,Value=MarkdownExportV2",
              "Key=exportScope,Value=Note",
              "Key=destination,Value=clipboard",
            ],
            fname: "root",
            vault: "vault1",
          });
          expect(resp.data?.config.podType).toEqual(
            PodV2Types.MarkdownExportV2
          );
          expect(resp.data?.config.exportScope).toEqual(PodExportScope.Note);
          return;
        },
        { expect }
      );
    });
  });

  // dendron exportPodV2
  describe("WHEN no config is given", () => {
    test("THEN error must be thrown", async () => {
      await runEngineTestV5(
        async ({ wsRoot }) => {
          const cmd = new ExportPodV2CLICommand();
          const resp = await cmd.enrichArgs({
            wsRoot,
          });
          expect(resp.error?.severity).toEqual(ERROR_SEVERITY.FATAL);
          expect(resp.error?.message).toEqual(
            "no pod config found. Please provide a pod config or inline config"
          );
          return;
        },
        { expect }
      );
    });
  });

  // dendron exportPodV2 --inlineConfig Key=exportScope,Value=Vault --podId dendron.markdown
  describe("WHEN both --podId and --inlineConfig is given", () => {
    test("THEN inlineConfig values should be of higher precedence", async () => {
      await runEngineTestV5(
        async ({ wsRoot }) => {
          const cmd = new ExportPodV2CLICommand();
          const podId = "dendron.markdown";
          const configPath = getCustomConfigPath(wsRoot, podId);
          writeYAML(configPath, {
            exportScope: "Workspace",
            podType: PodV2Types.MarkdownExportV2,
            destination: "workspace-exp",
          });
          const resp = await cmd.enrichArgs({
            wsRoot,
            inlineConfig: ["Key=exportScope,Value=Vault"],
            podId,
            vault: "vault1",
          });
          expect(resp.data?.config.exportScope).toEqual(PodExportScope.Vault);
          expect(resp.data?.config.destination).toEqual("workspace-exp");
          return;
        },
        { expect }
      );
    });
  });

  // dendron exportPodV2 --podId dendron.gdoc
  describe("WHEN custom config has a connectionId is given", () => {
    test("THEN pod args are enriched with service connection values", async () => {
      await runEngineTestV5(
        async ({ wsRoot }) => {
          const cmd = new ExportPodV2CLICommand();
          const podId = "dendron.gdoc";
          const connectionId = "gdoc-main";
          const configPath = getCustomConfigPath(wsRoot, podId);
          const svcCongingPath = getSvcConfigPath(wsRoot, connectionId);
          writeYAML(configPath, {
            exportScope: "Workspace",
            podType: PodV2Types.GoogleDocsExportV2,
            connectionId,
          });
          writeYAML(svcCongingPath, {
            accessToken: "test",
            refreshToken: "refresh",
            expirationTime: Time.now(),
            serviceType: ExternalService.GoogleDocs,
          });
          const resp = await cmd.enrichArgs({
            wsRoot,
            podId,
          });
          expect(resp.data?.config.accessToken).toEqual("test");
          expect(resp.data?.config.podType).toEqual(
            PodV2Types.GoogleDocsExportV2
          );
          return;
        },
        { expect }
      );
    });
  });

  // dendron exportPodV2 --podId dendron.foo
  describe("WHEN invalid podId is given", () => {
    test("THEN error must be thrown", async () => {
      await runEngineTestV5(
        async ({ wsRoot }) => {
          const cmd = new ExportPodV2CLICommand();
          const podId = "dendron.foo";
          const configPath = getCustomConfigPath(wsRoot, podId);
          const resp = await cmd.enrichArgs({
            wsRoot,
            inlineConfig: ["Key=exportScope,Value=Vault"],
            podId,
            vault: "vault1",
          });
          expect(resp.error?.severity).toEqual(ERROR_SEVERITY.FATAL);
          expect(resp.error?.message).toEqual(
            `no pod config found for this podId. Please create a pod config at ${configPath}`
          );
          return;
        },
        { expect }
      );
    });
  });
});
