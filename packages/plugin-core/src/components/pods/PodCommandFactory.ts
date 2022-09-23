import { assertUnreachable, DendronError } from "@dendronhq/common-all";
import {
  ExportPodConfigurationV2,
  PodExportScope,
  PodV2ConfigManager,
  PodV2Types,
} from "@dendronhq/pods-core";
import path from "path";
import { CodeCommandInstance } from "../../commands/base";
import { AirtableExportPodCommand } from "../../commands/pods/AirtableExportPodCommand";
import { GoogleDocsExportPodCommand } from "../../commands/pods/GoogleDocsExportPodCommand";
import { JSONExportPodCommand } from "../../commands/pods/JSONExportPodCommand";
import { MarkdownExportPodCommand } from "../../commands/pods/MarkdownExportPodCommand";
import { NotionExportPodCommand } from "../../commands/pods/NotionExportPodCommand";
import { ExtensionProvider } from "../../ExtensionProvider";

export class PodCommandFactory {
  /**
   * Creates a runnable vs code command that will execute the appropriate pod
   * based on the passed in pod configuration
   * @param configId
   * @returns A pod command configured with the found configuration
   */
  public static createPodCommandForStoredConfig({
    configId,
    exportScope,
    config,
  }: {
    configId?: Pick<ExportPodConfigurationV2, "podId">;
    exportScope?: PodExportScope;
    config?: ExportPodConfigurationV2 & { destination?: string };
  }): CodeCommandInstance {
    // configId is a required param for all cases except when called from CopyAsCommand. It sends a predefined config
    if (!configId && !config) {
      throw new DendronError({
        message: `Please provide a config id to continue.`,
      });
    }
    let podType: PodV2Types;
    let storedConfig: ExportPodConfigurationV2 | undefined;
    if (config) {
      podType = config.podType;
      storedConfig = config;
    } else {
      if (!configId) {
        throw new DendronError({
          message: `Please provide a config id`,
        });
      }

      storedConfig = PodV2ConfigManager.getPodConfigById({
        podsDir: path.join(ExtensionProvider.getPodsDir(), "custom"),
        opts: configId,
      });

      if (!storedConfig) {
        throw new DendronError({
          message: `No pod config with id ${configId.podId} found.`,
        });
      }
      // overrides the exportScope of stored config with the exportScope passed in args
      if (exportScope) {
        storedConfig.exportScope = exportScope;
      }
      podType = storedConfig.podType;
    }
    let cmdWithArgs: CodeCommandInstance;
    const extension = ExtensionProvider.getExtension();
    switch (podType) {
      case PodV2Types.AirtableExportV2: {
        const airtableCmd = new AirtableExportPodCommand(extension);
        cmdWithArgs = {
          key: airtableCmd.key,
          run(): Promise<void> {
            return airtableCmd.run(storedConfig);
          },
        };
        break;
      }
      case PodV2Types.MarkdownExportV2: {
        const cmd = new MarkdownExportPodCommand(extension);
        cmdWithArgs = {
          key: cmd.key,
          run(): Promise<void> {
            return cmd.run(storedConfig);
          },
        };
        break;
      }
      case PodV2Types.GoogleDocsExportV2: {
        const cmd = new GoogleDocsExportPodCommand(extension);
        cmdWithArgs = {
          key: cmd.key,
          run(): Promise<void> {
            return cmd.run(storedConfig);
          },
        };
        break;
      }
      case PodV2Types.NotionExportV2: {
        const cmd = new NotionExportPodCommand(extension);
        cmdWithArgs = {
          key: cmd.key,
          run(): Promise<void> {
            return cmd.run(storedConfig);
          },
        };
        break;
      }

      case PodV2Types.JSONExportV2: {
        const cmd = new JSONExportPodCommand(extension);
        cmdWithArgs = {
          key: cmd.key,
          run(): Promise<void> {
            return cmd.run(storedConfig);
          },
        };
        break;
      }

      default:
        throw new Error(`Unsupported PodV2 Type: ${storedConfig.podType}`);
    }

    return cmdWithArgs;
  }

  /**
   * Creates a vanilla pod command for the specified Pod(V2) type. This is meant
   * to be used when there is no pre-existing pod config for the command - no
   * arguments will be passed to the pod command for run().
   * @param podType
   * @returns
   */
  public static createPodCommandForPodType(
    podType: PodV2Types
  ): CodeCommandInstance {
    const extension = ExtensionProvider.getExtension();
    switch (podType) {
      case PodV2Types.AirtableExportV2: {
        const cmd = new AirtableExportPodCommand(extension);

        return {
          key: cmd.key,
          run(): Promise<void> {
            return cmd.run();
          },
        };
      }

      case PodV2Types.MarkdownExportV2: {
        const cmd = new MarkdownExportPodCommand(extension);

        return {
          key: cmd.key,
          run(): Promise<void> {
            return cmd.run();
          },
        };
      }
      case PodV2Types.GoogleDocsExportV2: {
        const cmd = new GoogleDocsExportPodCommand(extension);
        return {
          key: cmd.key,
          run(): Promise<void> {
            return cmd.run();
          },
        };
      }
      case PodV2Types.NotionExportV2: {
        const cmd = new NotionExportPodCommand(extension);
        return {
          key: cmd.key,
          run(): Promise<void> {
            return cmd.run();
          },
        };
      }

      case PodV2Types.JSONExportV2: {
        const cmd = new JSONExportPodCommand(extension);
        return {
          key: cmd.key,
          run(): Promise<void> {
            return cmd.run();
          },
        };
      }
      default:
        assertUnreachable(podType);
    }
  }
}
