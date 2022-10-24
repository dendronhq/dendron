import { RenderNoteResp } from "@dendronhq/common-all";
import {
  Comment,
  CommentAuthorInformation,
  CommentMode,
  MarkdownString,
} from "vscode";

export class NoteRefComment implements Comment {
  public body: MarkdownString;
  public mode: CommentMode;
  public author: CommentAuthorInformation;

  constructor(renderResp: RenderNoteResp) {
    this.mode = CommentMode.Preview;
    this.author = { name: "" };
    const mdString = renderResp.error
      ? new MarkdownString(`Error: ${renderResp.error}`)
      : new MarkdownString(renderResp.data);
    mdString.supportHtml = true;
    mdString.isTrusted = true;
    this.body = mdString;
  }
}
