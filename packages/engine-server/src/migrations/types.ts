import {
  IntermediateDendronConfig,
  DendronError,
  WorkspaceSettings,
} from "@dendronhq/common-all";
import { WorkspaceService } from "../workspace";

export * from "./service";

export type MigrateFunction = (opts: {
  dendronConfig: IntermediateDendronConfig;
  wsConfig: WorkspaceSettings;
  wsService: WorkspaceService;
}) => Promise<{
  error?: DendronError;
  data: { 
    dendronConfig: IntermediateDendronConfig; 
    wsConfig: WorkspaceSettings 
  };
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
    dendronConfig: IntermediateDendronConfig;
    wsConfig: WorkspaceSettings;
  };
};
