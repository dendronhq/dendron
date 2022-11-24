import { DendronConfigEntryCollection } from "../../types/configs/base";
import { DendronDevConfig } from "../../types/configs/dev/DendronDevConfig";

export const DEV: DendronConfigEntryCollection<DendronDevConfig> = {
  nextServerUrl: {
    label: "Next Server URL",
    desc: "Custom URL for the nextjs server.",
  },
  nextStaticRoot: {
    label: "Next Static Root",
    desc: "Root directory for the static assets of the nextjs server.",
  },
  engineServerPort: {
    label: "Engine Server Port",
    desc: "What port to use for the engine server. Defaults to creating on startup.",
  },
  enableLinkCandidates: {
    label: "Enable Link Candidates",
    desc: "Enable displaying and indexing link candidates. Defaults to false.",
  },
  enablePreviewV2: {
    label: "Enable Preview V2",
    desc: "Use preview V2 as the default preview.",
  },
  enableExportPodV2: {
    label: "Enable Export Pod V2",
    desc: "Enable experimental Export V2 command",
  },
  enableSelfContainedVaults: {
    label: "Enable self contained vaults",
    desc: "If enabled, Dendron will create self contained vaults. Dendron can still read self contained vaults even if this is disabled.",
  },
  forceWatcherType: {
    label: "Specify the file watcher type",
    desc: "plugin: Uses VSCode's builtin watcher, engine: Uses the engine watcher, watching the files directly without VSCode",
  },
  enableExperimentalIFrameNoteRef: {
    label: "Enable iframe note references.",
    desc: "Uses iframes for note references when publishing a vault using the nextjs export pod.",
  },
  enableEngineV3: {
    label: "Enable Engine V3",
    desc: "Uses engine v3 as default backend",
  },
  useSqlite: {
    label: "Use Sqlite",
    desc: "Use Sqlite as the Metadatastore. Requires enableEngineV3 to be true",
  },
  enableExperimentalInlineNoteRef: {
    label: "Enable inline note references.",
    desc: "Uses inline note references in Editor",
  },
};
