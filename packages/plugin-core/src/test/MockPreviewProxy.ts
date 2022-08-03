import { NoteProps } from "@dendronhq/common-all";
import { PreviewProxy } from "../components/views/PreviewProxy";

/**
 * Mock Preview Proxy. This should accurately reflect state of visible and open
 * properties without actually requiring a vscode webview for testing.
 */
export class MockPreviewProxy implements PreviewProxy {
  _isVisible: boolean = false;
  _isOpen: boolean = false;
  _isLocked: boolean = false;
  async show(_note?: NoteProps): Promise<void> {
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
  lock(_noteId?: string): void {
    this._isLocked = true;
  }
  unlock(): void {
    this._isLocked = false;
  }
  isLocked(): boolean {
    return this._isLocked;
  }
}
