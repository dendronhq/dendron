import { NoteProps } from "@dendronhq/common-all";
import { RunnablePodConfigV2 } from "..";

/**
 * Interface for constructing ExportPodV2's.
 */
export interface ExportPodFactory<T extends RunnablePodConfigV2, R> {
  createPod(config: T): ExportPodV2<R>;
}

/**
 * Interface for export pods. Pods may support exporting raw text, a note, or
 * both.
 * @template R - The return value from the export operation. This can be used
 * for callback operations once the export is complete
 */
export interface ExportPodV2<R> {
  exportText?(input: string): Promise<R>;

  exportNote?(input: NoteProps): Promise<R>;

  /**
   * Bulk export of notes. Allows for external API optimizations such as call
   * batching
   * @param input
   */
  exportNotes?(input: NoteProps[]): Promise<R>;
}
