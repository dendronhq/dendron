import * as fs from "fs";
import * as path from "path";
import { FileSystemError, Uri, workspace } from "vscode";

export class FileItem {
  private SourcePath: Uri;
  private TargetPath: Uri | undefined;

  constructor(
    sourcePath: Uri | string,
    targetPath?: Uri | string,
    private IsDir: boolean = false
  ) {
    this.SourcePath = this.toUri(sourcePath);
    if (targetPath !== undefined) {
      this.TargetPath = this.toUri(targetPath);
    }
  }

  get name(): string {
    return path.basename(this.SourcePath.path);
  }

  get path(): Uri {
    return this.SourcePath;
  }

  get targetPath(): Uri | undefined {
    return this.TargetPath;
  }

  get exists(): boolean {
    if (this.targetPath === undefined) {
      return false;
    }
    return fs.existsSync(this.targetPath.fsPath);
  }

  get isDir(): boolean {
    return this.IsDir;
  }

  public async move(): Promise<FileItem> {
    this.ensureTargetPath();
    await workspace.fs.rename(this.path, this.targetPath!, { overwrite: true });

    this.SourcePath = this.targetPath!;
    return this;
  }

  public async duplicate(): Promise<FileItem> {
    this.ensureTargetPath();
    await workspace.fs.copy(this.path, this.targetPath!, { overwrite: true });

    return new FileItem(this.targetPath!);
  }

  public async remove(useTrash = false): Promise<FileItem> {
    try {
      await workspace.fs.delete(this.path, { recursive: true, useTrash });
    } catch (err) {
      if (useTrash === true && err instanceof FileSystemError) {
        return this.remove(false);
      }
      throw err;
    }
    return this;
  }

  public async create(mkDir?: boolean): Promise<FileItem> {
    this.ensureTargetPath();

    if (this.exists) {
      await workspace.fs.delete(this.targetPath!, { recursive: true });
    }

    if (mkDir === true || this.isDir) {
      await workspace.fs.createDirectory(this.targetPath!);
    } else {
      await workspace.fs.writeFile(this.targetPath!, new Uint8Array());
    }

    return new FileItem(this.targetPath!);
  }

  private ensureTargetPath() {
    if (this.targetPath === undefined) {
      throw new Error("Missing target path");
    }
  }

  private toUri(uriOrString: Uri | string): Uri {
    return uriOrString instanceof Uri ? uriOrString : Uri.file(uriOrString);
  }
}
