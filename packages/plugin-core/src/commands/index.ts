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
import { InsertNoteLinkCommand } from "./InsertNoteLink";
import { InsertNoteIndexCommand } from "./InsertNoteIndexCommand";
import { MoveNoteCommand } from "./MoveNoteCommand";
import { NoteLookupCommand } from "./NoteLookupCommand";
import { SchemaLookupCommand } from "./SchemaLookupCommand";
import { OpenLinkCommand } from "./OpenLink";
import { OpenLogsCommand } from "./OpenLogs";
import { PasteFileCommand } from "./PasteFile";
import { PasteLinkCommand } from "./PasteLink";
import { PublishPodCommand } from "./PublishPod";
import { RefactorHierarchyCommandV2 } from "./RefactorHierarchyV2";
import { ResetConfigCommand } from "./ResetConfig";
import { RestoreVaultCommand } from "./RestoreVault";
import { SetupWorkspaceCommand } from "./SetupWorkspace";
import { ShowHelpCommand } from "./ShowHelp";
import { ShowNoteGraphCommand } from "./ShowNoteGraph";
import { ShowSchemaGraphCommand } from "./ShowSchemaGraph";
import { ShowPreviewCommand } from "./ShowPreview";
import { ShowPreviewV2Command } from "./ShowPreviewV2";
import { SignInCommand } from "./SignIn";
import { SignUpCommand } from "./SignUp";
import { SiteBuildCommand } from "./SiteBuild";
import { SitePreviewCommand } from "./SitePreview";
import { SnapshotVaultCommand } from "./SnapshotVault";
import { SyncCommand } from "./Sync";
import { UpgradeSettingsCommand } from "./UpgradeSettings";
import { VaultAddCommand } from "./VaultAddCommand";
import { VaultRemoveCommand } from "./VaultRemoveCommand";
import { RandomNoteCommand } from "./RandomNote";
import { LaunchTutorialCommand } from "./LaunchTutorialCommand";
import { ConvertLinkCommand } from "./ConvertLink";
import { ConfigureGraphStylesCommand } from "./ConfigureGraphStyles";
import { RenameHeaderCommand } from "./RenameHeader";
import { MoveHeaderCommand } from "./MoveHeader";
import { SeedAddCommand } from "./SeedAddCommand";
import { SeedRemoveCommand } from "./SeedRemoveCommand";
import { RunMigrationCommand } from "./RunMigrationCommand";
import { SeedBrowseCommand } from "./SeedBrowseCommand";

const ALL_COMMANDS = [
  AddAndCommit,
  ArchiveHierarchyCommand,
  BrowseNoteCommand,
  ChangeWorkspaceCommand,
  ConfigureCommand,
  ConfigurePodCommand,
  ConfigureGraphStylesCommand,
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
  GoUpCommand,
  GotoNoteCommand,
  ImportPodCommand,
  InsertNoteCommand,
  InsertNoteLinkCommand,
  InsertNoteIndexCommand,
  NoteLookupCommand,
  SchemaLookupCommand,
  OpenLinkCommand,
  OpenLogsCommand,
  PasteFileCommand,
  PasteLinkCommand,
  PublishPodCommand,
  MoveNoteCommand,
  RenameHeaderCommand,
  MoveHeaderCommand,
  RefactorHierarchyCommandV2,
  RandomNoteCommand,
  ResetConfigCommand,
  RestoreVaultCommand,
  // SetupWorkspaceCommand,
  ShowHelpCommand,
  ShowNoteGraphCommand,
  ShowSchemaGraphCommand,
  ShowPreviewCommand,
  ShowPreviewV2Command,
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
  LaunchTutorialCommand,
  ConvertLinkCommand,
  SeedAddCommand,
  SeedRemoveCommand,
  SeedBrowseCommand,
] as CodeCommandConstructor[];

// when("betaFeatures", ()=> {
//   ALL_COMMANDS.push(SetupWorkspaceCommandV2 as CodeCommandConstructor);
// })

export { ALL_COMMANDS };
