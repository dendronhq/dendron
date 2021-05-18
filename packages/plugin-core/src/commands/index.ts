import { AddAndCommit } from "./AddAndCommit";
import { ArchiveHierarchyCommand } from "./ArchiveHierarchy";
import { CodeCommandConstructor } from "./base";
import { BrowseNoteCommand } from "./BrowseNoteCommand";
import { ChangeWorkspaceCommand } from "./ChangeWorkspace";
import { ConfigureCommand } from "./ConfigureCommand";
import { ConfigurePodCommand } from "./ConfigurePodCommand";
import { ConfigureWithUICommand } from "./ConfigureWithUI";
import { ContributeCommand } from "./Contribute";
import { CopyNoteLinkCommand } from "./CopyNoteLink";
import { CopyNoteRefCommand } from "./CopyNoteRef";
import { CopyNoteURLCommand } from "./CopyNoteURL";
import { CreateDailyJournalCommand } from "./CreateDailyJournal";
import { CreateHookCommand } from "./CreateHookCommand";
import { DeleteHookCommand } from "./DeleteHookCommand";
import { DeleteNodeCommand } from "./DeleteNodeCommand";
import { DiagnosticsReportCommand } from "./DiagnosticsReport";
import { DisableTelemetryCommand } from "./DisableTelemetry";
import { DoctorCommand } from "./Doctor";
import { DumpStateCommand } from "./DumpStateCommand";
import { EnableTelemetryCommand } from "./EnableTelemetry";
import { ExportPodCommand } from "./ExportPod";
import { GoDownCommand } from "./GoDownCommand";
import { GotoNoteCommand } from "./GotoNote";
import { GoUpCommand } from "./GoUpCommand";
import { ImportPodCommand } from "./ImportPod";
import { InsertNoteCommand } from "./InsertNoteCommand";
import { MoveNoteCommand } from "./MoveNoteCommand";
import { OpenLogsCommand } from "./OpenLogs";
import { PasteLinkCommand } from "./PasteLink";
import { PublishPodCommand } from "./PublishPod";
import { RefactorHierarchyCommandV2 } from "./RefactorHierarchyV2";
import { ResetConfigCommand } from "./ResetConfig";
import { RestoreVaultCommand } from "./RestoreVault";
import { SetupWorkspaceCommand } from "./SetupWorkspace";
import { ShowHelpCommand } from "./ShowHelp";
import { ShowPreviewCommand } from "./ShowPreview";
import { SignInCommand } from "./SignIn";
import { SignUpCommand } from "./SignUp";
import { SiteBuildCommand } from "./SiteBuild";
import { SitePreviewCommand } from "./SitePreview";
import { SnapshotVaultCommand } from "./SnapshotVault";
import { SyncCommand } from "./Sync";
import { UpgradeSettingsCommand } from "./UpgradeSettings";
import { VaultAddCommand } from "./VaultAddCommand";
import { VaultRemoveCommand } from "./VaultRemoveCommand";

const ALL_COMMANDS = [
  AddAndCommit,
  ArchiveHierarchyCommand,
  BrowseNoteCommand,
  ChangeWorkspaceCommand,
  ConfigureCommand,
  ConfigurePodCommand,
  ContributeCommand,
  CopyNoteLinkCommand,
  CopyNoteRefCommand,
  CopyNoteURLCommand,
  CreateDailyJournalCommand,
  CreateHookCommand,
  DeleteHookCommand,
  DeleteNodeCommand,
  DiagnosticsReportCommand,
  DisableTelemetryCommand,
  EnableTelemetryCommand,
  DoctorCommand,
  DumpStateCommand,
  ExportPodCommand,
  GoDownCommand,
  //   GoToSiblingCommand,
  GoUpCommand,
  GotoNoteCommand,
  ImportPodCommand,
  InsertNoteCommand,
  //   LookupCommand,
  OpenLogsCommand,
  PasteLinkCommand,
  PublishPodCommand,
  MoveNoteCommand,
  RefactorHierarchyCommandV2,
  // ReloadIndexCommand,
  ResetConfigCommand,
  RestoreVaultCommand,
  SetupWorkspaceCommand,
  ShowHelpCommand,
  ShowPreviewCommand,
  SignInCommand,
  SignUpCommand,
  SiteBuildCommand,
  SitePreviewCommand,
  SnapshotVaultCommand,
  SyncCommand,
  ConfigureWithUICommand,
  UpgradeSettingsCommand,
  VaultAddCommand,
  VaultRemoveCommand,
] as CodeCommandConstructor[];

// when("betaFeatures", ()=> {
//   ALL_COMMANDS.push(SetupWorkspaceCommandV2 as CodeCommandConstructor);
// })

export { ALL_COMMANDS };
