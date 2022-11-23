import { DVault, NoteProps } from "@dendronhq/common-all";
import {
  AirtableConnection,
  AirtableV2PodConfig,
  ExportPodV2,
  JSONSchemaType,
  PodExportScope,
  RunnablePodConfigV2,
} from "@dendronhq/pods-core";
import { HierarchySelector } from "../../../../../src/components/lookup/HierarchySelector";
import { BaseExportPodCommand } from "../../../../../src/commands/pods/BaseExportPodCommand";
import { ExtensionProvider } from "../../../../ExtensionProvider";
import { IDendronExtension } from "../../../../dendronExtensionInterface";

/**
 * Test implementation of BaseExportPodCommand. For testing purposes only.
 */
export class TestExportPodCommand extends BaseExportPodCommand<
  RunnablePodConfigV2,
  string
> {
  public key = "dendron.testexport";

  /**
   * Hardcoded to return the 'foo' Hierarchy and vault[0] from ENGINE_HOOKS.setupBasic
   */
  static mockedSelector: HierarchySelector = {
    getHierarchy(): Promise<{ hierarchy: string; vault: DVault } | undefined> {
      return new Promise<{ hierarchy: string; vault: DVault } | undefined>(
        // eslint-disable-next-line no-async-promise-executor
        async (resolve) => {
          const vaults = await ExtensionProvider.getDWorkspace().vaults;
          resolve({ hierarchy: "foo", vault: vaults[0] });
        }
      );
    },
  };

  public constructor(extension: IDendronExtension) {
    super(TestExportPodCommand.mockedSelector, extension);
  }

  /**
   * Note hard coded return values - these can be amended as new tests are written.
   * @param _config
   * @returns
   */
  public createPod(_config: RunnablePodConfigV2): ExportPodV2<string> {
    return {
      exportNotes() {
        return new Promise<string>((resolve) => resolve("note"));
      },
    };
  }

  public getRunnableSchema(): JSONSchemaType<RunnablePodConfigV2> {
    return {
      type: "object",
      required: ["exportScope"],
      properties: {
        exportScope: {
          description: "export scope of the pod",
          type: "string",
        },
      },
    } as JSONSchemaType<RunnablePodConfigV2>;
  }

  async gatherInputs(
    _opts?: Partial<AirtableV2PodConfig & AirtableConnection>
  ): Promise<RunnablePodConfigV2 | undefined> {
    return {
      exportScope: PodExportScope.Note,
    };
  }

  /**
   * No - op for now. TODO: Add validation on export
   * @param exportReturnValue
   * @returns
   */
  public async onExportComplete(_opts: {
    exportReturnValue: string;
    config: RunnablePodConfigV2;
    payload: NoteProps | NoteProps[];
  }): Promise<void> {}
}
