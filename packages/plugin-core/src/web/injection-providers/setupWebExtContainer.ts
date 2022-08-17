import {
  EngineEventEmitter,
  IDataStore,
  IFileStore,
  INoteStore,
  NoteMetadataStore,
  NotePropsMeta,
  NoteStore,
  type ReducedDEngine,
} from "@dendronhq/common-all";
import { container, Lifecycle } from "tsyringe";
import { type ILookupProvider } from "../commands/lookup/ILookupProvider";
import { NoteLookupProvider } from "../commands/lookup/NoteLookupProvider";
import { DendronEngineV3Web } from "../engine/DendronEngineV3Web";
import { VSCodeFileStore } from "../engine/store/VSCodeFileStore";
import { type ITreeViewConfig } from "../views/treeView/ITreeViewConfig";
import { TreeViewDummyConfig } from "../views/treeView/TreeViewDummyConfig";
import { getVaults } from "./getVaults";
import { getWSRoot } from "./getWSRoot";

/**
 * This function prepares a TSyringe container suitable for the Web Extension
 * flavor of the Dendron Plugin.
 *
 * It uses a VSCodeFileStore and includes a reduced engine that runs in-memory.
 */
export async function setupWebExtContainer() {
  const wsRoot = await getWSRoot();

  if (!wsRoot) {
    throw new Error("Unable to find wsRoot!");
  }
  const vaults = await getVaults(wsRoot);

  // The EngineEventEmitter is also DendronEngineV3Web, so reuse the same token
  // to supply any emitter consumers. This ensures the same engine singleton
  // gets used everywhere.
  container.register<EngineEventEmitter>("EngineEventEmitter", {
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

  container.register<IDataStore<string, NotePropsMeta>>(
    "IDataStore",
    {
      useClass: NoteMetadataStore,
    },
    { lifecycle: Lifecycle.Singleton }
  );

  container.register("wsRoot", { useValue: wsRoot });
  container.register("vaults", { useValue: vaults });

  // TODO: Get rid of this in favor or using DI in Note Store / common-all package.
  const fs = container.resolve<IFileStore>("IFileStore");
  const ds = container.resolve<IDataStore<string, NotePropsMeta>>("IDataStore");

  const noteStore = new NoteStore(fs, ds, wsRoot);

  container.register<INoteStore<string>>("INoteStore", {
    useValue: noteStore,
  });

  container.register<ILookupProvider>("NoteProvider", {
    useClass: NoteLookupProvider,
  });

  container.afterResolution<DendronEngineV3Web>(
    "ReducedDEngine",
    (_t, result) => {
      if ("init" in result) {
        result.init().then(
          () => {},
          (reason) => {
            throw new Error(`Dendron Engine Failed to Initialize: ${reason}`);
          }
        );
      }
    },
    { frequency: "Once" }
  );

  container.register<ITreeViewConfig>("ITreeViewConfig", {
    useClass: TreeViewDummyConfig,
  });
}
