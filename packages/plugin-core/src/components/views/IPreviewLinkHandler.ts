import { NoteViewMessage } from "@dendronhq/common-all";

export enum LinkType {
  WIKI = "WIKI",
  ASSET = "ASSET",
  WEBSITE = "WEBSITE",
  TEXT = "TEXT",
  COMMAND = "COMMAND",
  UNKNOWN = "UNKNOWN",
}

/**
 * Interface for handling preview link click events
 */
export interface IPreviewLinkHandler {
  /**
   * Handle the event of a user clicking on a link in the preview webview pane
   * @param param0
   */
  onLinkClicked({ data }: { data: NoteViewMessage["data"] }): Promise<LinkType>;
}
