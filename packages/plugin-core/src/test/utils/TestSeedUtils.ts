import { SeedService } from "@dendronhq/engine-server";
import sinon from "sinon";
import { SeedAddCommand } from "../../commands/SeedAddCommand";
import { SeedRemoveCommand } from "../../commands/SeedRemoveCommand";

export class PluginTestSeedUtils {
  static getFakedAddCommand(svc: SeedService) {
    const cmd = new SeedAddCommand(svc);

    const fakedOnUpdating = sinon.fake.resolves(null);
    const fakedOnUpdated = sinon.fake.resolves(null);

    sinon.replace(cmd, <any>"onUpdatingWorkspace", fakedOnUpdating);
    sinon.replace(cmd, <any>"onUpdatedWorkspace", fakedOnUpdated);

    return { cmd, fakedOnUpdating, fakedOnUpdated };
  }

  static getFakedRemoveCommand(svc: SeedService) {
    const cmd = new SeedRemoveCommand(svc);

    const fakedOnUpdating = sinon.fake.resolves(null);
    const fakedOnUpdated = sinon.fake.resolves(null);

    sinon.replace(cmd, <any>"onUpdatingWorkspace", fakedOnUpdating);
    sinon.replace(cmd, <any>"onUpdatedWorkspace", fakedOnUpdated);

    return { cmd, fakedOnUpdating, fakedOnUpdated };
  }
}
