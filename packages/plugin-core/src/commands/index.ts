import { ArchiveHierarchyCommand } from "./ArchiveHierarchy";
import { BrowseNoteCommand } from "./BrowseNoteCommand";
import { CapitalizeSelectionCommand } from "./CapitalizeSelectionCommand";
import { CodeCommandConstructor } from "./base";
import { ChangeWorkspaceCommand } from "./ChangeWorkspace";
import { ConfigureCommand } from "./ConfigureCommand";
import { ConfigurePodCommand } from "./ConfigurePodCommand";
import { ConfigureWithUICommand } from "./ConfigureWithUI";
import { ContributeCommand } from "./Contribute";
import { CopyNoteLinkCommand } from "./CopyNoteLink";
import { CopyNoteRefCommand } from "./CopyNoteRef";
import { CopyNoteURLCommand } from "./CopyNoteURL";
import { CreateDailyJournalCommand } from "./CreateDailyJournal";
import { DeleteNodeCommand } from "./DeleteNodeCommand";
import { DiagnosticsReportCommand } from "./DiagnosticsReport";
import { DoctorCommand } from "./Doctor";
import { DumpStateCommand } from "./DumpStateCommand";
import { ExportPodCommand } from "./ExportPod";
import { GoDownCommand } from "./GoDownCommand";
import { GotoNoteCommand } from "./GotoNote";
import { GoUpCommand } from "./GoUpCommand";
import { ImportPodCommand } from "./ImportPod";
import { MoveNoteCommand } from "./MoveNoteCommand";
import { OpenLogsCommand } from "./OpenLogs";
import { PasteLinkCommand } from "./PasteLink";
import { PublishPodCommand } from "./PublishPod";
import { RefactorHierarchyCommandV2 } from "./RefactorHierarchyV2";
import { RenameNoteV2aCommand } from "./RenameNoteV2a";
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
import { UpgradeSettingsCommand } from "./UpgradeSettings";
import { VaultAddCommand } from "./VaultAddCommand";
import { VaultRemoveCommand } from "./VaultRemoveCommand";

const ALL_COMMANDS = [
  ArchiveHierarchyCommand,
  BrowseNoteCommand,
  CapitalizeSelectionCommand,
  ChangeWorkspaceCommand,
  ConfigureCommand,
  ConfigurePodCommand,
  ContributeCommand,
  CopyNoteLinkCommand,
  CopyNoteRefCommand,
  CopyNoteURLCommand,
  CreateDailyJournalCommand,
  DeleteNodeCommand,
  DiagnosticsReportCommand,
  DoctorCommand,
  DumpStateCommand,
  ExportPodCommand,
  GoDownCommand,
  //   GoToSiblingCommand,
  GoUpCommand,
  GotoNoteCommand,
  ImportPodCommand,
  //   LookupCommand,
  OpenLogsCommand,
  PasteLinkCommand,
  PublishPodCommand,
  MoveNoteCommand,
  RefactorHierarchyCommandV2,
  // ReloadIndexCommand,
  RenameNoteV2aCommand,
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
  ConfigureWithUICommand,
  UpgradeSettingsCommand,
  VaultAddCommand,
  VaultRemoveCommand,
] as CodeCommandConstructor[];

// when("betaFeatures", ()=> {
//   ALL_COMMANDS.push(SetupWorkspaceCommandV2 as CodeCommandConstructor);
// })

export { ALL_COMMANDS };
