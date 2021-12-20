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
 * VSCode command for running the Airtable Export Pod. It is not meant to be
 * directly invoked throught the command palette, but is invoked by
 * {@link ExportPodV2Command}
 */
export class TestExportPodCommand extends BaseExportPodCommand<
  RunnablePodConfigV2,
  string
> {
  public key = "dendron.testexport";

  static mockedSelector: HierarchySelector = {
    getHierarchy(): Promise<string | undefined> {
      return new Promise<string | undefined>((resolve) => {
        resolve("foo"); // foo Hierarchy from ENGINE_HOOKS.setupBasic
      });
    },
  };

  public constructor() {
    super(TestExportPodCommand.mockedSelector);
  }

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
   * Upon finishing the export, add the airtable record ID back to the
   * corresponding note in Dendron, so that on future writes, we know how to
   * distinguish between whether a note export should create a new row in
   * Airtable or update an existing one.
   * @param exportReturnValue
   * @returns
   */
  public onExportComplete(_opts: {
    exportReturnValue: string;
    config: RunnablePodConfigV2;
    payload: string | NoteProps;
  }): void {}
}
