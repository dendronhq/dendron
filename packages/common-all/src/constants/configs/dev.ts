import { DendronConfigEntryCollection } from "../../types/configs/base";
import { DendronDevConfig } from "../../types/configs/dev/dev";

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
  enableWebUI: {
    label: "Enable web UI",
    desc: "Enable experimental web ui. Defaults to false.",
  },
  enableLinkCandidates: {
    label: "Enable Link Candidates",
    desc: "Enable displaying and indexing link candidates. Defaults to false.",
  },
  enablePreviewV2: {
    label: "Enable Preview V2",
    desc: "Use preview V2 as the default preview.",
  },
  enablePreviewDirectImage: {
    label: "Enable Preview Direct Image",
    desc: "Enable the engine to directly encode and send images with the preview instead of proxying them separately. Enabling this may slow down the preview. Defaults to false (images are proxied).",
  },
};
