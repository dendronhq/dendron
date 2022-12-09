import {
  DVault,
  EngineEventEmitter,
  genUUID,
  IDataStore,
  IFileStore,
  INoteStore,
  ReducedDEngine,
  NoteMetadataStore,
  NoteProps,
  NotePropsMeta,
  NoteStore,
  NoteUtils,
  FuseEngine,
  DendronConfig,
  DendronPublishingConfig,
} from "@dendronhq/common-all";
import { container, Lifecycle } from "tsyringe";
import { ILookupProvider } from "../../commands/lookup/ILookupProvider";
import { NoteLookupProvider } from "../../commands/lookup/NoteLookupProvider";
import { DendronEngineV3Web } from "../../engine/DendronEngineV3Web";
import { VSCodeFileStore } from "../../engine/store/VSCodeFileStore";
import { ITreeViewConfig } from "../../../views/common/treeview/ITreeViewConfig";
import { TreeViewDummyConfig } from "../../../views/common/treeview/TreeViewDummyConfig";

import _ from "lodash";
import { URI } from "vscode-uri";
import { note2File } from "../../utils/note2File";
import { WorkspaceHelpers } from "./WorkspaceHelpers";

/**
 * Prepare a test container for running a real engine against a temporary
 * vault/note set. For most tests, this won't actually be necessary because we
 * can just run against in-memory notes
 */
export async function setupTestEngineContainer() {
  const wsRoot = await setupTestFiles();

  const vaults = await getVaults();

  await setupHierarchyForLookupTests(vaults, wsRoot);
  const noteMetadataStore = new NoteMetadataStore(
    new FuseEngine({
      fuzzThreshold: 0.2,
    })
  );

  container.register<EngineEventEmitter>("EngineEventEmitter", {
    useToken: "ReducedDEngine",
  });

  // Getting a DendronEngineV3Web instance is necessary for testing so that you
  // can call init() on it prior to running the test
  container.register<EngineEventEmitter>(DendronEngineV3Web, {
    useToken: "ReducedDEngine",
  });

  container.register<ReducedDEngine>(
    "ReducedDEngine",
    {
      useClass: DendronEngineV3Web,
    },
    { lifecycle: Lifecycle.Singleton }
  );

  container.register<IFileStore>("IFileStore", {
    useClass: VSCodeFileStore,
  });

  container.register<IDataStore<string, NotePropsMeta>>("IDataStore", {
    useValue: noteMetadataStore,
  });

  container.register("wsRoot", { useValue: wsRoot });
  container.register("vaults", { useValue: vaults });

  const fs = container.resolve<IFileStore>("IFileStore");
  const ds = container.resolve<IDataStore<string, NotePropsMeta>>("IDataStore");

  const noteStore = new NoteStore(fs, ds, wsRoot);

  container.register<INoteStore<string>>("INoteStore", {
    useValue: noteStore,
  });

  container.register<ILookupProvider>("NoteProvider", {
    useClass: NoteLookupProvider,
  });

  container.register<ITreeViewConfig>("ITreeViewConfig", {
    useClass: TreeViewDummyConfig,
  });

  const config = getConfig();
  container.register<DendronConfig>("DendronConfig", {
    useValue: config as DendronConfig,
  });
}

async function setupTestFiles(): Promise<URI> {
  const wsRoot = await WorkspaceHelpers.getWSRootForTest();

  return wsRoot;
}

async function getVaults(): Promise<DVault[]> {
  const vaults: DVault[] = [
    { fsPath: "vault1" },
    // { fsPath: "vault2", path: Utils.joinPath(wsRoot, "vault2") },
    // {
    //   fsPath: "vault3",
    //   name: "vaultThree",
    //   path: Utils.joinPath(wsRoot, "vault3"),
    // },
  ];

  return vaults;
}

// Logic below is temporarily borrowed from engine-test-utils:
async function setupHierarchyForLookupTests(vaults: DVault[], wsRoot: URI) {
  const opts = {
    vault: vaults[0],
    wsRoot,
  };
  const fnames = [
    "root",
    "foo",
    "foo.ch1",
    "foo.ch1.gch1",
    "foo.ch1.gch1.ggch1",
    "foo.ch1.gch2",
    "foo.ch2",
    "bar",
    "bar.ch1",
    "bar.ch1.gch1",
    "bar.ch1.gch1.ggch1",
    "goo.ends-with-ch1.no-ch1-by-itself",
  ];

  return Promise.all(
    fnames.map((fname) => {
      return createNote({ ...opts, fname });
    })
  );
}

type CreateNoteOptsV4 = {
  vault: DVault;
  wsRoot: URI;
  fname: string;
  body?: string;
  props?: Partial<Omit<NoteProps, "vault" | "fname" | "body" | "custom">>;
  genRandomId?: boolean;
  noWrite?: boolean;
  custom?: any;
  stub?: boolean;
};

export async function createNote(opts: CreateNoteOptsV4) {
  const {
    fname,
    vault,
    props,
    body,
    genRandomId,
    noWrite,
    wsRoot,
    custom,
    stub,
  } = _.defaults(opts, { noWrite: false });
  /**
   * Make sure snapshots stay consistent
   */
  const defaultOpts = {
    created: 1,
    updated: 1,
    id: genRandomId ? genUUID() : fname,
  };

  const note = NoteUtils.create({
    ...defaultOpts,
    ...props,
    custom,
    fname,
    vault,
    body,
    stub,
  });
  if (!noWrite && !stub) {
    await note2File({ note, vault, wsRoot });
  }
  return note;
}

export function getConfig(): DendronConfig {
  const pubConfig: DendronPublishingConfig = {
    copyAssets: false,
    siteHierarchies: [],
    enableSiteLastModified: false,
    siteRootDir: "",
    enableFrontmatterTags: false,
    enableHashesForFMTags: false,
    writeStubs: false,
    seo: {
      title: undefined,
      description: undefined,
      author: undefined,
      twitter: undefined,
      image: undefined,
    },
    github: {
      cname: undefined,
      enableEditLink: false,
      editLinkText: undefined,
      editBranch: undefined,
      editViewMode: undefined,
      editRepository: undefined,
    },
    enablePrettyLinks: false,
  };

  const config: DendronConfig = {
    version: 5,
    publishing: pubConfig,
  } as DendronConfig;
  return config;
}
