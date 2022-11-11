import { TextDocumentService } from "./node/TextDocumentService";
import { ITextDocumentService } from "./ITextDocumentService";
import { container } from "tsyringe";

export class TextDocumentServiceFactory {
  private static _textDocumentService: ITextDocumentService | undefined;

  /**
   * Instantiate TextDocumentService to be used in _extension.ts/workspace.ts
   */
  public static create(): ITextDocumentService {
    // Simple singleton implementation
    if (!TextDocumentServiceFactory._textDocumentService) {
      TextDocumentServiceFactory._textDocumentService =
        container.resolve(TextDocumentService);
    }

    return TextDocumentServiceFactory._textDocumentService;
  }
}
