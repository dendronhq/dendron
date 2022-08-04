import {
  IDataStore,
  IFileStore,
  INoteStore,
  NoteMetadataStore,
  NotePropsMeta,
  NoteStore,
} from "@dendronhq/common-all";
import { container, Lifecycle } from "tsyringe";
import { ILookupProvider } from "../commands/lookup/ILookupProvider";
import { NoteLookupProvider } from "../commands/lookup/NoteLookupProvider";
import { DendronEngineV3Web } from "../engine/DendronEngineV3Web";
import { IReducedEngineAPIService } from "../engine/IReducedEngineApiService";
import { VSCodeFileStore } from "../engine/store/VSCodeFileStore";
import { getVaults } from "./getVaults";
import { getWSRoot } from "./getWSRoot";

export async function setupWebExtContainer() {
  const wsRoot = await getWSRoot();

  if (!wsRoot) {
    throw new Error("Unable to find wsRoot!");
  }
  const vaults = await getVaults(wsRoot);

  container.register<IReducedEngineAPIService>(
    "IReducedEngineAPIService",
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
    "IReducedEngineAPIService",
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
}
