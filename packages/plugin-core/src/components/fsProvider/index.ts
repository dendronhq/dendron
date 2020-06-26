import * as vscode from "vscode";

import { DEngine, DNode, Note } from "@dendronhq/common-all";

import { DEFAULT_ROOT } from "../lookup/constants";
import _ from "lodash";
import { createLogger } from "@dendronhq/common-server";
import { engine } from "@dendronhq/engine-server";
import path from "path";

const L = createLogger("extension");

export class File implements vscode.FileStat {
  type: vscode.FileType;
  ctime: number;
  mtime: number;
  size: number;
  node: DNode | null;

  name: string;
  data?: Uint8Array;

  constructor(nodeOrString: DNode | string) {
    this.type = vscode.FileType.File;
    this.ctime = Date.now();
    this.mtime = Date.now();
    this.size = 0;
    if (_.isString(nodeOrString)) {
      this.name = nodeOrString;
      this.node = null;
    } else {
      this.node = nodeOrString;
      this.name = nodeOrString.title;
      this.data = Buffer.from(nodeOrString.body);
    }
  }
}

export class Directory implements vscode.FileStat {
  type: vscode.FileType;
  ctime: number;
  mtime: number;
  size: number;

  name: string;
  entries: Map<string, File | Directory>;
  node: DNode | null;

  constructor(nodeOrString: DNode | string) {
    this.type = vscode.FileType.Directory;
    this.ctime = Date.now();
    this.mtime = Date.now();
    this.size = 0;
    this.entries = new Map();
    if (_.isString(nodeOrString)) {
      this.name = nodeOrString;
      this.node = null;
    } else {
      this.node = nodeOrString;
      this.name = nodeOrString.title;
      nodeOrString.children.forEach((n) => {
        if (n.children.length === 0) {
          this.entries.set(n.title, new File(n));
        } else {
          this.entries.set(n.title, new Directory(n));
        }
        this.size += 1;
      });
    }
  }
}

export type Entry = File | Directory;

export class DendronFileSystemProvider implements vscode.FileSystemProvider {
  public engine: DEngine;
  public rootNoteDir: Directory;

  private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
  readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this
    ._emitter.event;

  private _lookup(uri: vscode.Uri, silent: false): Entry;
  private _lookup(uri: vscode.Uri, silent: boolean): Entry | undefined;
  private _lookup(uri: vscode.Uri, silent: boolean): Entry | undefined {
    const engine = this.engine;
    let parts = uri.path.split("/");
    let entry: Entry = this.root;
    for (const part of parts) {
      if (!part) {
        continue;
      }
      let child: Entry | undefined;
      if (entry instanceof Directory) {
        child = entry.entries.get(part);
      }
      if (!child) {
        if (!silent) {
          throw vscode.FileSystemError.FileNotFound(uri);
        } else {
          return undefined;
        }
      }
      entry = child;
    }
    return entry;
  }

  private _lookupAsDirectory(uri: vscode.Uri, silent: boolean): Directory {
    let entry = this._lookup(uri, silent);
    if (entry instanceof Directory) {
      return entry;
    }
    throw vscode.FileSystemError.FileNotADirectory(uri);
  }

  private _lookupAsFile(uri: vscode.Uri, silent: boolean): File {
    let entry = this._lookup(uri, silent);
    if (entry instanceof File) {
      return entry;
    }
    throw vscode.FileSystemError.FileIsADirectory(uri);
  }

  private _lookupParentDirectory(uri: vscode.Uri): Directory {
    const dirname = uri.with({ path: path.posix.dirname(uri.path) });
    return this._lookupAsDirectory(dirname, false);
  }

  static async create(): Promise<DendronFileSystemProvider> {
    const ctx = "cons";
    return new Promise((resolve, _reject) => {
      Promise.all([
        engine({ root: DEFAULT_ROOT }).query(
          { username: "DUMMY" },
          "**/*",
          "note",
          {
            fullNode: false,
            initialQuery: true,
          }
        ),
        engine({ root: DEFAULT_ROOT }).query(
          { username: "DUMMY" },
          "**/*",
          "schema",
          {
            fullNode: false,
            initialQuery: true,
          }
        ),
      ]).then(async () => {
        console.log("engine init");
        L.info({ ctx: ctx + ":engine:init:post", schemas: engine().schemas });
        resolve(new DendronFileSystemProvider(engine()));
      });
    });
  }

  constructor(engine: DEngine) {
    this.engine = engine;
    this.rootNoteDir = new Directory(this.engine.notes["root"]);
  }

  get root() {
    return this.rootNoteDir;
  }

  // --- manage files/folders
  createDirectory(uri: vscode.Uri): void {
    let basename = path.posix.basename(uri.path);
    let dirname = uri.with({ path: path.posix.dirname(uri.path) });
    let parent = this._lookupAsDirectory(dirname, false);

    let entry = new Directory(basename);
    parent.entries.set(entry.name, entry);
    parent.mtime = Date.now();
    parent.size += 1;
    this._fireSoon(
      { type: vscode.FileChangeType.Changed, uri: dirname },
      { type: vscode.FileChangeType.Created, uri }
    );
  }

  delete(uri: vscode.Uri): void {
    let dirname = uri.with({ path: path.posix.dirname(uri.path) });
    let basename = path.posix.basename(uri.path);
    let parent = this._lookupAsDirectory(dirname, false);
    if (!parent.entries.has(basename)) {
      throw vscode.FileSystemError.FileNotFound(uri);
    }
    parent.entries.delete(basename);
    parent.mtime = Date.now();
    parent.size -= 1;
    this._fireSoon(
      { type: vscode.FileChangeType.Changed, uri: dirname },
      { uri, type: vscode.FileChangeType.Deleted }
    );
  }

  readDirectory(uri: vscode.Uri): [string, vscode.FileType][] {
    const entry = this._lookupAsDirectory(uri, false);
    let result: [string, vscode.FileType][] = [];
    for (const [name, child] of entry.entries) {
      result.push([name, child.type]);
    }
    return result;
  }

  readFile(uri: vscode.Uri): Uint8Array {
    const data = this._lookupAsFile(uri, false).data;
    if (data) {
      return data;
    }
    throw vscode.FileSystemError.FileNotFound();
  }

  stat(uri: vscode.Uri): vscode.FileStat {
    return this._lookup(uri, false);
  }

  watch(_resource: vscode.Uri): vscode.Disposable {
    // ignore, fires for all changes...
    return new vscode.Disposable(() => {});
  }

  rename(
    oldUri: vscode.Uri,
    newUri: vscode.Uri,
    options: { overwrite: boolean }
  ): void {
    if (!options.overwrite && this._lookup(newUri, true)) {
      throw vscode.FileSystemError.FileExists(newUri);
    }

    let entry = this._lookup(oldUri, false);
    let oldParent = this._lookupParentDirectory(oldUri);

    let newParent = this._lookupParentDirectory(newUri);
    let newName = path.posix.basename(newUri.path);

    oldParent.entries.delete(entry.name);
    entry.name = newName;
    newParent.entries.set(newName, entry);

    this._fireSoon(
      { type: vscode.FileChangeType.Deleted, uri: oldUri },
      { type: vscode.FileChangeType.Created, uri: newUri }
    );
  }

  writeFile(
    uri: vscode.Uri,
    content: Uint8Array,
    options: { create: boolean; overwrite: boolean }
  ): void {
    let basename = path.posix.basename(uri.path);
    let parent = this._lookupParentDirectory(uri);
    let entry = parent.entries.get(basename);
    if (entry instanceof Directory) {
      throw vscode.FileSystemError.FileIsADirectory(uri);
    }
    if (!entry && !options.create) {
      throw vscode.FileSystemError.FileNotFound(uri);
    }
    if (entry && options.create && !options.overwrite) {
      throw vscode.FileSystemError.FileExists(uri);
    }
    if (!entry) {
      entry = new File(basename);
      parent.entries.set(basename, entry);
      this._fireSoon({ type: vscode.FileChangeType.Created, uri });
    }
    entry.mtime = Date.now();
    entry.size = content.byteLength;
    entry.data = content;

    this._fireSoon({ type: vscode.FileChangeType.Changed, uri });
  }

  // --- manage file events

  private _fireSoonHandle?: NodeJS.Timer;
  private _bufferedEvents: vscode.FileChangeEvent[] = [];

  private _fireSoon(...events: vscode.FileChangeEvent[]): void {
    this._bufferedEvents.push(...events);

    if (this._fireSoonHandle) {
      clearTimeout(this._fireSoonHandle);
    }

    this._fireSoonHandle = setTimeout(() => {
      this._emitter.fire(this._bufferedEvents);
      this._bufferedEvents.length = 0;
    }, 5);
  }
}
