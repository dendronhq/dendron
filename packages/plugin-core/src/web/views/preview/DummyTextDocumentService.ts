import { NoteProps } from "@dendronhq/common-all";
import { ITextDocumentService } from "../../../services/ITextDocumentService";
import { TextDocumentChangeEvent, TextDocument } from "vscode";

export class DummyTextDocumentService implements ITextDocumentService {
  processTextDocumentChangeEvent(
    _event: TextDocumentChangeEvent
  ): Promise<NoteProps | undefined> {
    return Promise.resolve(undefined);
    // throw new Error("Method not implemented.");
  }
  applyTextDocumentToNoteProps(
    note: NoteProps,
    _textDocument: TextDocument
  ): Promise<NoteProps> {
    return Promise.resolve(note);
    // throw new Error("Method not implemented.");
  }
  dispose() {
    // throw new Error("Method not implemented.");
  }
}
