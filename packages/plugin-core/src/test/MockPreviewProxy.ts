import { NoteProps } from "@dendronhq/common-all";
import { PreviewProxy } from "../components/views/PreviewProxy";

/**
 * Mock Preview Proxy. This should accurately reflect state of visible and open
 * properties without actually requiring a vscode webview for testing.
 */
export class MockPreviewProxy implements PreviewProxy {
  _isVisible: boolean = false;
  _isOpen: boolean = false;
  show(_note?: NoteProps): void {
    this._isVisible = true;
    this._isOpen = true;
  }
  hide(): void {
    this._isOpen = false;
    this._isVisible = false;
  }
  isVisible(): boolean {
    return this._isVisible;
  }
  isOpen(): boolean {
    return this._isOpen;
  }
}
