// import * as vscode from "vscode";

// import { DEngine, DNode, Note } from "@dendronhq/common-all";

// import { DEFAULT_ROOT } from "../lookup/constants";
// import { TextDecoder } from "util";
// import _ from "lodash";
// import { createLogger } from "@dendronhq/common-server";
// import { fnameToUri } from "../lookup/utils";
// import { getOrCreateEngine } from "@dendronhq/engine-server";
// import path from "path";

// const L = createLogger("extension");

// function uriToFname(uri: vscode.Uri): string {
//   // folder: /foo/index
//   return _.trimStart(uri.path, "/")
//     .replace(/\/index$/, "")
//     .replace(/\//g, ".");
// }

// type LookupOpts = {
//   createStubDirs?: boolean;
// };

// type GetOrCreateOpts = {
//   root?: string;
//   initializeEngine?: boolean;
// };

// type InitializeEngineOpts = {
//   root: string;
// };

// export class File implements vscode.FileStat {
//   type: vscode.FileType;
//   ctime: number;
//   mtime: number;
//   size: number;
//   node: DNode | null;

//   name: string;
//   data?: Uint8Array;

//   constructor(nodeOrString: DNode | string) {
//     this.type = vscode.FileType.File;
//     this.ctime = Date.now();
//     this.mtime = Date.now();
//     this.size = 0;
//     if (_.isString(nodeOrString)) {
//       this.name = nodeOrString;
//       this.node = null;
//     } else {
//       this.node = nodeOrString;
//       this.name = nodeOrString.basename;
//       this.data = Buffer.from(nodeOrString.body);
//     }
//   }
// }

// export class Directory implements vscode.FileStat {
//   type: vscode.FileType;
//   ctime: number;
//   mtime: number;
//   size: number;

//   name: string;
//   entries: Map<string, File | Directory>;
//   node: DNode | null;

//   constructor(nodeOrString: DNode | string) {
//     this.type = vscode.FileType.Directory;
//     this.ctime = Date.now();
//     this.mtime = Date.now();
//     this.size = 0;
//     this.entries = new Map();
//     if (_.isString(nodeOrString)) {
//       this.name = nodeOrString;
//       this.node = null;
//     } else {
//       this.node = nodeOrString;
//       this.name = nodeOrString.basename;
//       this.entries.set("index", new File(nodeOrString));
//       nodeOrString.children.forEach((n) => {
//         if (n.children.length === 0) {
//           this.entries.set(n.basename, new File(n));
//         } else {
//           this.entries.set(n.basename, new Directory(n));
//         }
//       });
//       this.size = nodeOrString.children.length + 1;
//     }
//   }
// }

// export type Entry = File | Directory;

// let _DendronFileSystemProvider: DendronFileSystemProvider | null = null;

// export class DendronFileSystemProvider implements vscode.FileSystemProvider {
//   static initialized = false;
//   public engine: DEngine;
//   public rootNoteDir: Directory | null;

//   private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
//   readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this
//     ._emitter.event;

//   private async _lookup(
//     uri: vscode.Uri,
//     silent: false,
//     opts?: LookupOpts
//   ): Promise<Entry>;
//   private async _lookup(
//     uri: vscode.Uri,
//     silent: boolean,
//     opts?: LookupOpts
//   ): Promise<Entry | undefined>;
//   private async _lookup(
//     uri: vscode.Uri,
//     silent: boolean,
//     opts?: LookupOpts
//   ): Promise<Entry | undefined> {
//     opts = _.defaults(opts, { createStubDirs: false });
//     let parts = uri.path.split("/");
//     let partsAcc: string[] = [];
//     if (_.isNull(this.root)) {
//       throw new Error("root not initialized");
//     }
//     let entry: Entry = this.root;
//     for (const part of parts) {
//       if (!part) {
//         continue;
//       }
//       partsAcc.push(part);
//       let child: Entry | undefined;
//       if (entry instanceof Directory) {
//         child = entry.entries.get(part);
//       }
//       if (!child && opts.createStubDirs) {
//         // check if absolute path
//         let prefix = (path.isAbsolute(uri.path) ? "/" : "");
//         const partsAccUri = vscode.Uri.parse(
//           `${uri.scheme}:${prefix}${partsAcc.join("/")}`,
//           true
//         );
//         await this.createDirectory(partsAccUri, { writeToEngine: true });
//         child = await this._lookupAsDirectory(partsAccUri, false);
//       }

//       if (!child) {
//         if (!silent) {
//           throw vscode.FileSystemError.FileNotFound(uri);
//         } else {
//           return undefined;
//         }
//       }
//       entry = child;
//     }
//     return entry;
//   }

//   private async _lookupAsDirectory(
//     uri: vscode.Uri,
//     silent: boolean,
//     opts?: LookupOpts
//   ): Promise<Directory> {
//     let entry = await this._lookup(uri, silent, opts);
//     if (entry instanceof Directory) {
//       return entry;
//     } else {
//       // create dir if it is currently a file
//       let qs = uriToFname(uri);
//       const fileNode = await getOrCreateEngine().query(
//         { username: "DUMMY" },
//         qs,
//         "note",
//         {
//           queryOne: true,
//         }
//       );
//       await this.delete(uri);
//       await this.createDirectory(uri);
//       qs += ".index";
//       const uriNew = await fnameToUri(qs, { checkIfDirectoryFile: false });
//       await this.writeFile(uriNew, Buffer.from(fileNode.data[0].body), {
//         create: true,
//         overwrite: true,
//         writeToEngine: false,
//       });
//       return this._lookupAsDirectory(uri, false);
//     }
//   }

//   private async _lookupAsFile(uri: vscode.Uri, silent: boolean): Promise<File> {
//     let entry = await this._lookup(uri, silent);
//     if (entry instanceof File) {
//       return entry;
//     }
//     throw vscode.FileSystemError.FileIsADirectory(uri);
//   }

//   private async _lookupParentDirectory(
//     uri: vscode.Uri,
//     opts?: LookupOpts
//   ): Promise<Directory> {
//     const dirname = uri.with({ path: path.posix.dirname(uri.path) });
//     return this._lookupAsDirectory(dirname, false, opts);
//   }

//   static async getOrCreate(
//     opts?: GetOrCreateOpts
//   ): Promise<DendronFileSystemProvider> {
//     const optsClean = _.defaults(opts, {
//       root: DEFAULT_ROOT,
//       initializeEngine: true,
//     });
//     if (_.isNull(_DendronFileSystemProvider)) {
//       _DendronFileSystemProvider = new DendronFileSystemProvider(
//         getOrCreateEngine({ root: opts?.root })
//       );
//     }
//     return _DendronFileSystemProvider;
//   }

//   constructor(engine: DEngine) {
//     this.engine = engine;
//     this.rootNoteDir = null
//     // /if (engine.opts) {
//     //   this.initialize({root: this.engine.opts.root});
//     // }
//   }

//   get root() {
//     return this.rootNoteDir;
//   }

//   // --- engine
//   // TODO: move this method into engine
//   async initialize(opts: InitializeEngineOpts) {
//     const engine = await getOrCreateEngine({ root: opts.root, forceNew: true });
//     this.engine = engine
//     await engine.query({ username: "DUMMY" }, "**/*", "schema", {
//       fullNode: false,
//       initialQuery: true,
//     });
//     await engine.query({ username: "DUMMY" }, "**/*", "note", {
//       fullNode: false,
//       initialQuery: true,
//     });
//     this.rootNoteDir = new Directory(engine.notes["root"]);
//     return;
//   }

//   // --- manage files/folders
//   /**
//    *
//    * @param uri
//    * @param opts
//    *   - NOTE: writeToEngine: if specified, write to engine as stub
//    */
//   async createDirectory(
//     uri: vscode.Uri,
//     opts?: { writeToEngine?: boolean }
//   ): Promise<void> {
//     opts = _.defaults(opts, { writeToEngine: false });
//     let basename = path.posix.basename(uri.path);
//     let dirname = uri.with({ path: path.posix.dirname(uri.path) });
//     let parent = await this._lookupAsDirectory(dirname, false);

//     let entry = new Directory(basename);
//     parent.entries.set(entry.name, entry);
//     parent.mtime = Date.now();
//     parent.size += 1;
//     if (opts.writeToEngine) {
//       await this._writeToEngine(uri, null, { writeStub: true });
//     }
//     this._fireSoon(
//       { type: vscode.FileChangeType.Changed, uri: dirname },
//       { type: vscode.FileChangeType.Created, uri }
//     );
//     return;
//   }

//   async delete(uri: vscode.Uri): Promise<void> {
//     let dirname = uri.with({ path: path.posix.dirname(uri.path) });
//     let basename = path.posix.basename(uri.path);
//     let parent = await this._lookupAsDirectory(dirname, false);
//     if (!parent.entries.has(basename)) {
//       throw vscode.FileSystemError.FileNotFound(uri);
//     }
//     parent.entries.delete(basename);
//     parent.mtime = Date.now();
//     parent.size -= 1;
//     this._fireSoon(
//       { type: vscode.FileChangeType.Changed, uri: dirname },
//       { uri, type: vscode.FileChangeType.Deleted }
//     );
//   }

//   async readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
//     const entry = await this._lookupAsDirectory(uri, false);
//     let result: [string, vscode.FileType][] = [];
//     for (const [name, child] of entry.entries) {
//       result.push([name, child.type]);
//     }
//     return result;
//   }

//   async readFile(uri: vscode.Uri): Promise<Uint8Array> {
//     const data = (await this._lookupAsFile(uri, false)).data;
//     if (data) {
//       return data;
//     }
//     throw vscode.FileSystemError.FileNotFound();
//   }

//   async stat(uri: vscode.Uri): Promise<vscode.FileStat> {
//     return await this._lookup(uri, false);
//   }

//   watch(_resource: vscode.Uri): vscode.Disposable {
//     // ignore, fires for all changes...
//     return new vscode.Disposable(() => {});
//   }

//   async rename(
//     oldUri: vscode.Uri,
//     newUri: vscode.Uri,
//     options: { overwrite: boolean }
//   ): Promise<void> {
//     if (!options.overwrite && (await this._lookup(newUri, true))) {
//       throw vscode.FileSystemError.FileExists(newUri);
//     }

//     let entry = await this._lookup(oldUri, false);
//     let oldParent = await this._lookupParentDirectory(oldUri);

//     let newParent = await this._lookupParentDirectory(newUri);
//     let newName = path.posix.basename(newUri.path);

//     oldParent.entries.delete(entry.name);
//     entry.name = newName;
//     newParent.entries.set(newName, entry);

//     this._fireSoon(
//       { type: vscode.FileChangeType.Deleted, uri: oldUri },
//       { type: vscode.FileChangeType.Created, uri: newUri }
//     );
//   }

//   async _writeToEngine(
//     uri: vscode.Uri,
//     content: Uint8Array | null,
//     opts?: { writeStub?: boolean }
//   ) {
//     opts = _.defaultTo(opts, { writeStub: false });
//     let note: Note;
//     const fname = uriToFname(uri);
//     let body = "";
//     if (content) {
//       body = new TextDecoder("utf-8").decode(content);
//     }
//     note = (
//       await getOrCreateEngine().query({ username: "DUMMY" }, fname, "note", {
//         queryOne: true,
//         createIfNew: true,
//         stub: opts.writeStub,
//       })
//     ).data[0] as Note;
//     note.body = body;
//     return getOrCreateEngine().write({ username: "DUMMY" }, note, {
//       stub: opts.writeStub,
//     });
//   }

//   async writeFile(
//     uri: vscode.Uri,
//     content: Uint8Array,
//     options: { create: boolean; overwrite: boolean; writeToEngine?: boolean }
//   ): Promise<void> {
//     options = _.defaults(options, { writeToEngine: true });
//     let basename = path.posix.basename(uri.path);
//     let parent = await this._lookupParentDirectory(uri, {
//       createStubDirs: true,
//     });
//     let entry = parent.entries.get(basename);
//     if (entry instanceof Directory) {
//       throw vscode.FileSystemError.FileIsADirectory(uri);
//     }
//     if (!entry && !options.create) {
//       throw vscode.FileSystemError.FileNotFound(uri);
//     }
//     if (entry && options.create && !options.overwrite) {
//       throw vscode.FileSystemError.FileExists(uri);
//     }
//     if (!entry) {
//       entry = new File(basename);
//       parent.entries.set(basename, entry);
//       this._fireSoon({ type: vscode.FileChangeType.Created, uri });
//     }
//     entry.mtime = Date.now();
//     entry.size = content.byteLength;
//     entry.data = content;
//     if (options.writeToEngine) {
//       await this._writeToEngine(uri, content);
//     }
//     this._fireSoon({ type: vscode.FileChangeType.Changed, uri });
//   }

//   // --- manage file events

//   private _fireSoonHandle?: NodeJS.Timer;
//   private _bufferedEvents: vscode.FileChangeEvent[] = [];

//   private _fireSoon(...events: vscode.FileChangeEvent[]): void {
//     this._bufferedEvents.push(...events);

//     if (this._fireSoonHandle) {
//       clearTimeout(this._fireSoonHandle);
//     }

//     this._fireSoonHandle = setTimeout(() => {
//       this._emitter.fire(this._bufferedEvents);
//       this._bufferedEvents.length = 0;
//     }, 5);
//   }
// }
