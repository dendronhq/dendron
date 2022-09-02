import { IDendronExtension } from "../dendronExtensionInterface";
import { TextDocumentService } from "./node/TextDocumentService";
import { workspace } from "vscode";
import { ITextDocumentService } from "./ITextDocumentService";

export class TextDocumentServiceFactory {
  private static _textDocumentService: ITextDocumentService | undefined;

  /**
   * Instantiate TextDocumentService to be used in _extension.ts/workspace.ts
   */
  public static create(extension: IDendronExtension): ITextDocumentService {
    // Simple singleton implementation
    if (!TextDocumentServiceFactory._textDocumentService) {
      TextDocumentServiceFactory._textDocumentService = new TextDocumentService(
        extension,
        workspace.onDidSaveTextDocument
      );
    }

    return TextDocumentServiceFactory._textDocumentService;
  }
}
