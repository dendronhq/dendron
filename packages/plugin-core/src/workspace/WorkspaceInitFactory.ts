import {
  MetadataService,
  WorkspaceActivationContext,
} from "@dendronhq/engine-server";
import { BlankInitializer } from "./blankInitializer";
import { SeedBrowserInitializer } from "./seedBrowserInitializer";
import { TutorialInitializer } from "./tutorialInitializer";
import { WorkspaceInitializer } from "./workspaceInitializer";

/**
 * Factory class for creating WorkspaceInitializer types
 */
export class WorkspaceInitFactory {
  static create(): WorkspaceInitializer | undefined {
    switch (MetadataService.instance().getActivationContext()) {
      case WorkspaceActivationContext.tutorial:
        return new TutorialInitializer();

      case WorkspaceActivationContext.seedBrowser:
        return new SeedBrowserInitializer();

      default:
        return new BlankInitializer();
    }
  }
}
