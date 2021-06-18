import {
  DendronConfig,
  DendronError,
  WorkspaceSettings,
} from "@dendronhq/common-all";
import { WorkspaceService } from "../workspace";
export * from "./service";

export type MigrateFunction = (opts: {
  dendronConfig: DendronConfig;
  wsConfig: WorkspaceSettings;
  wsService: WorkspaceService;
}) => Promise<{
  error?: DendronError;
  data: { dendronConfig: DendronConfig; wsConfig: WorkspaceSettings };
}>;

export type MigrationChangeSet = {
  name: string;
  func: MigrateFunction;
};

export type Migrations = {
  version: string;
  changes: MigrationChangeSet[];
};

export type MigrationChangeSetStatus = {
  error?: DendronError;
  data: {
    version: string;
    changeName: string;
    status: "ok" | "error";
    dendronConfig: DendronConfig;
    wsConfig: WorkspaceSettings;
  };
};
