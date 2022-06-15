import { AddAndCommit } from "./AddAndCommit";
import { ApplyTemplateCommand } from "./ApplyTemplateCommand";
import { ArchiveHierarchyCommand } from "./ArchiveHierarchy";
import { CodeCommandConstructor } from "./base";
import { BrowseNoteCommand } from "./BrowseNoteCommand";
import { ChangeWorkspaceCommand } from "./ChangeWorkspace";
import { ConfigureCommand } from "./ConfigureCommand";
import { ConfigureGraphStylesCommand } from "./ConfigureGraphStyles";
import { ConfigurePodCommand } from "./ConfigurePodCommand";
import { ConfigureWithUICommand } from "./ConfigureWithUI";
import { ContributeCommand } from "./Contribute";
import { ConvertCandidateLinkCommand } from "./ConvertCandidateLink";
import { ConvertLinkCommand } from "./ConvertLink";
import { CopyNoteLinkCommand } from "./CopyNoteLink";
import { CopyNoteRefCommand } from "./CopyNoteRef";
import { CopyNoteURLCommand } from "./CopyNoteURL";
import { CopyToClipboardCommand } from "./CopyToClipboardCommand";
import { CreateDailyJournalCommand } from "./CreateDailyJournal";
import { CreateHookCommand } from "./CreateHookCommand";
import { CreateJournalNoteCommand } from "./CreateJournalNoteCommand";
import { CreateMeetingNoteCommand } from "./CreateMeetingNoteCommand";
import { CreateNoteWithUserDefinedTrait } from "./CreateNoteWithUserDefinedTrait";
import { CreateSchemaFromHierarchyCommand } from "./CreateSchemaFromHierarchyCommand";
import { CreateScratchNoteCommand } from "./CreateScratchNoteCommand";
import { CreateTaskCommand } from "./CreateTask";
import { DeleteHookCommand } from "./DeleteHookCommand";
import { DeleteNodeCommand } from "./DeleteNodeCommand";
import { DevTriggerCommand } from "./DevTriggerCommand";
import { DiagnosticsReportCommand } from "./DiagnosticsReport";
import { DisableTelemetryCommand } from "./DisableTelemetry";
import { DoctorCommand } from "./Doctor";
import { DumpStateCommand } from "./DumpStateCommand";
import { EnableTelemetryCommand } from "./EnableTelemetry";
import { ExportPodCommand } from "./ExportPod";
import { GoDownCommand } from "./GoDownCommand";
import { GotoCommand } from "./Goto";
import { GotoNoteCommand } from "./GotoNote";
import { GoUpCommand } from "./GoUpCommand";
import { ImportPodCommand } from "./ImportPod";
import { InsertNoteIndexCommand } from "./InsertNoteIndexCommand";
import { InsertNoteLinkCommand } from "./InsertNoteLink";
import { InstrumentedWrapperCommand } from "./InstrumentedWrapperCommand";
import { LaunchTutorialWorkspaceCommand } from "./LaunchTutorialWorkspaceCommand";
import { MigrateSelfContainedVaultCommand } from "./MigrateSelfContainedVault";
import { MoveHeaderCommand } from "./MoveHeader";
import { MoveNoteCommand } from "./MoveNoteCommand";
import { NoteLookupAutoCompleteCommand } from "./NoteLookupAutoCompleteCommand";
import { NoteLookupCommand } from "./NoteLookupCommand";
import { OpenBackupCommand } from "./OpenBackupCommand";
import { OpenLinkCommand } from "./OpenLink";
import { OpenLogsCommand } from "./OpenLogs";
import { PasteFileCommand } from "./PasteFile";
import { PasteLinkCommand } from "./PasteLink";
import { ConfigureExportPodV2 } from "./pods/ConfigureExportPodV2";
import { ConfigureServiceConnection } from "./pods/ConfigureServiceConnection";
import { ExportPodV2Command } from "./pods/ExportPodV2Command";
import { ImportObsidianCommand } from "./pods/ImportObsidianCommand";
import { PublishDevCommand } from "./PublishDevCommand";
import { PublishExportCommand } from "./PublishExportCommand";
import { PublishPodCommand } from "./PublishPod";
import { RandomNoteCommand } from "./RandomNote";
import { RefactorHierarchyCommandV2 } from "./RefactorHierarchyV2";
import { RegisterNoteTraitCommand } from "./RegisterNoteTraitCommand";
import { RenameHeaderCommand } from "./RenameHeader";
import { ResetConfigCommand } from "./ResetConfig";
import { RestoreVaultCommand } from "./RestoreVault";
import { RunMigrationCommand } from "./RunMigrationCommand";
import { SchemaLookupCommand } from "./SchemaLookupCommand";
import { SetupWorkspaceCommand } from "./SetupWorkspace";
import { ShowHelpCommand } from "./ShowHelp";
import { ShowLegacyPreviewCommand } from "./ShowLegacyPreview";
import { ShowWelcomePageCommand } from "./ShowWelcomePageCommand";
import { SignInCommand } from "./SignIn";
import { SignUpCommand } from "./SignUp";
import { SnapshotVaultCommand } from "./SnapshotVault";
import { SyncCommand } from "./Sync";
import { TaskCompleteCommand } from "./TaskComplete";
import { TaskStatusCommand } from "./TaskStatus";
import { UpgradeSettingsCommand } from "./UpgradeSettings";
import { VaultAddCommand } from "./VaultAddCommand";
import { VaultConvertCommand } from "./VaultConvert";
import { VaultRemoveCommand } from "./VaultRemoveCommand";

/**
 * Note: this does not contain commands that have parametered constructors, as
 * those cannot be cast to the CodeCommandConstructor interface.
 */
const ALL_COMMANDS = [
  AddAndCommit,
  ArchiveHierarchyCommand,
  BrowseNoteCommand,
  ChangeWorkspaceCommand,
  ConfigureCommand,
  ConfigurePodCommand,
  ConfigureServiceConnection,
  ConfigureExportPodV2,
  ConfigureGraphStylesCommand,
  ContributeCommand,
  CopyNoteLinkCommand,
  CopyNoteRefCommand,
  CopyNoteURLCommand,
  CopyToClipboardCommand,
  CreateDailyJournalCommand,
  CreateHookCommand,
  MigrateSelfContainedVaultCommand,
  CreateSchemaFromHierarchyCommand,
  DeleteHookCommand,
  DeleteNodeCommand,
  DiagnosticsReportCommand,
  DisableTelemetryCommand,
  DevTriggerCommand,
  EnableTelemetryCommand,
  DoctorCommand,
  DumpStateCommand,
  ExportPodCommand,
  ExportPodV2Command,
  GoDownCommand,
  GoUpCommand,
  GotoCommand,
  GotoNoteCommand,
  ImportPodCommand,
  ImportObsidianCommand,
  InsertNoteLinkCommand,
  InsertNoteIndexCommand,
  NoteLookupCommand,
  NoteLookupAutoCompleteCommand,
  CreateJournalNoteCommand,
  CreateScratchNoteCommand,
  CreateMeetingNoteCommand,
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
  SetupWorkspaceCommand,
  ShowHelpCommand,
  ShowLegacyPreviewCommand,
  SignInCommand,
  SignUpCommand,
  PublishExportCommand,
  PublishDevCommand,
  SnapshotVaultCommand,
  SyncCommand,
  ApplyTemplateCommand,
  ConfigureWithUICommand,
  UpgradeSettingsCommand,
  VaultAddCommand,
  VaultRemoveCommand,
  VaultConvertCommand,
  ShowWelcomePageCommand,
  LaunchTutorialWorkspaceCommand,
  ConvertLinkCommand,
  ConvertCandidateLinkCommand,
  RunMigrationCommand,
  CreateTaskCommand,
  TaskStatusCommand,
  TaskCompleteCommand,
  RegisterNoteTraitCommand,
  CreateNoteWithUserDefinedTrait,
  OpenBackupCommand,
  InstrumentedWrapperCommand,
] as CodeCommandConstructor[];

export { ALL_COMMANDS };
