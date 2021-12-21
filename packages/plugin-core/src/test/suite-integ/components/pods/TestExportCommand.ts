import { NoteProps } from "@dendronhq/common-all";
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

/**
 * Test implementation of BaseExportPodCommand. For testing purposes only.
 */
export class TestExportPodCommand extends BaseExportPodCommand<
  RunnablePodConfigV2,
  string
> {
  public key = "dendron.testexport";

  /**
   * Hardcoded to return the 'foo' Hierarchy from ENGINE_HOOKS.setupBasic
   */
  static mockedSelector: HierarchySelector = {
    getHierarchy(): Promise<string | undefined> {
      return new Promise<string | undefined>((resolve) => {
        resolve("foo");
      });
    },
  };

  public constructor() {
    super(TestExportPodCommand.mockedSelector);
  }

  /**
   * Note hard coded return values - these can be amended as new tests are written.
   * @param _config
   * @returns
   */
  public createPod(_config: RunnablePodConfigV2): ExportPodV2<string> {
    return {
      exportNote() {
        return new Promise<string>((resolve) => resolve("note"));
      },

      exportText() {
        return new Promise<string>((resolve) => resolve("text"));
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
  public onExportComplete(_opts: {
    exportReturnValue: string;
    config: RunnablePodConfigV2;
    payload: string | NoteProps | NoteProps[];
  }): void {}
}
