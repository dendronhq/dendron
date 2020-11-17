import { ArchiveHierarchyCommand } from "./ArchiveHierarchy";
import { CodeCommandConstructor } from "./base";
import { BuildPodCommand } from "./BuildPod";
import { ChangeWorkspaceCommand } from "./ChangeWorkspace";
import { ConfigureCommand } from "./ConfigureCommand";
import { ConfigurePodCommand } from "./ConfigurePodCommand";
import { ContributeCommand } from "./Contribute";
import { CopyNoteLinkCommand } from "./CopyNoteLink";
import { CopyNoteRefCommand } from "./CopyNoteRef";
import { CopyNoteURLCommand } from "./CopyNoteURL";
import { CreateDailyJournalCommand } from "./CreateDailyJournal";
import { DeleteNodeCommand } from "./DeleteNodeCommand";
import { DoctorCommand } from "./Doctor";
import { DumpStateCommand } from "./DumpStateCommand";
import { ExportPodCommand } from "./ExportPod";
import { GoDownCommand } from "./GoDownCommand";
import { GotoNoteCommand } from "./GotoNote";
import { GoToSiblingCommand } from "./GoToSiblingCommand";
import { GoUpCommand } from "./GoUpCommand";
import { ImportPodCommand } from "./ImportPod";
import { LookupCommand } from "./LookupCommand";
import { OpenLogsCommand } from "./OpenLogs";
import { PublishCommand } from "./Publish";
import { PublishPodCommand } from "./PublishPod";
import { RefactorCommand } from "./Refactor";
import { RefactorHierarchyCommandV2 } from "./RefactorHierarchyV2";
import { ReloadIndexCommand } from "./ReloadIndex";
import { RenameNoteV2aCommand } from "./RenameNoteV2a";
import { ResetConfigCommand } from "./ResetConfig";
import { RestoreVaultCommand } from "./RestoreVault";
import { SetupWorkspaceCommand } from "./SetupWorkspace";
import { ShowHelpCommand } from "./ShowHelp";
import { ShowPreviewCommand } from "./ShowPreview";
import { SnapshotVaultCommand } from "./SnapshotVault";
import { UpdateSchemaCommand } from "./UpdateSchema";
import { UpgradeSettingsCommand } from "./UpgradeSettings";
import { VaultAddCommand } from "./VaultAddCommand";
import { VaultRemoveCommand } from "./VaultRemoveCommand";

export const ALL_COMMANDS = [
  ArchiveHierarchyCommand,
  //   BuildPodCommand,
  //   ChangeWorkspaceCommand,
  //   ConfigureCommand,
  ConfigurePodCommand,
  ContributeCommand,
  CopyNoteLinkCommand,
  CopyNoteRefCommand,
  CopyNoteURLCommand,
  CreateDailyJournalCommand,
  DeleteNodeCommand,
  DoctorCommand,
  DumpStateCommand,
  ExportPodCommand,
  GoDownCommand,
  //   GoToSiblingCommand,
  GoUpCommand,
  //   GotoNoteCommand,
  //   ImportPodCommand,
  //   LookupCommand,
  //   OpenLogsCommand,
  //   PublishCommand,
  //   PublishPodCommand,
  //   RefactorCommand,
  RefactorHierarchyCommandV2,
  // ReloadIndexCommand,
  RenameNoteV2aCommand,
  ResetConfigCommand,
  RestoreVaultCommand,
  SetupWorkspaceCommand,
  ShowHelpCommand,
  ShowPreviewCommand,
  SnapshotVaultCommand,
  //   UpdateSchemaCommand,
  // UpgradeSettingsCommand,
  VaultAddCommand,
  VaultRemoveCommand,
] as CodeCommandConstructor[];
