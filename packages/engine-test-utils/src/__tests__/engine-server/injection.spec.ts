import { IntermediateDendronConfig } from "@dendronhq/common-all";
import { createLogger, DLogger } from "@dendronhq/common-server";
import {
  DConfig,
  DendronEngineV2,
  FileStorage,
} from "@dendronhq/engine-server";
import { container, delay } from "tsyringe";
import { setupWS } from "../../engine";

describe("tsyringe demo tests", () => {
  test("create DendronEngine using EngineV2 with FileStorage Combo", async () => {
    const { wsRoot, vaults } = await setupWS({
      vaults: [
        { fsPath: "vault1" },
        { fsPath: "vault2" },
        { fsPath: "vault3", name: "vaultThree" },
      ],
    });

    const LOGGER = createLogger();
    const config = DConfig.readConfigAndApplyLocalOverrideSync(wsRoot);

    container.register("wsRoot", { useValue: wsRoot });
    container.register("vaults", { useValue: vaults });

    container.register<DLogger>("DLogger", {
      useValue: LOGGER,
    });

    container.register<IntermediateDendronConfig>("IntermediateDendronConfig", {
      useValue: config,
    });

    // delay is needed because we have a circular dependency between FileStorage and DEngineClient
    container.register("DStore", { useToken: delay(() => FileStorage) });
    container.register("DEngineClient", { useClass: DendronEngineV2 });

    // Get the engine instance.  In practice, we do this container.resolve() in the Main() function.
    const instance = container.resolve(DendronEngineV2);
  });
});
