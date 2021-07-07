import {
  Config,
  ArrayConfig,
  BooleanConfig,
  EnumConfig,
  StringConfig,
  NumberConfig,
  RecordConfig,
  ObjectConfig,
} from "../types/formTypes";

const siteConfig: ObjectConfig = {
  type: "object",
  data: {
    siteRootDir: {
      label: "Site Root Directory",
      type: "string",
      required: true,
      helperText:
        "Where your site will be published. Relative to Dendron workspace",
    },
    assetPrefix: {
      label: "Asset Prefix",
      type: "string",
      helperText: "If set, add prefix to all asset links",
    },
    copyAssets: {
      label: "Copy Assets",
      type: "boolean",
      helperText: "Copy assets from vault to site.",
    },
    siteRepotDir: {
      label: "Site Repo Directory",
      type: "string",
      helperText:
        "Location of the github repo where your site notes are located. By default, this is assumed to be your `workspaceRoot` if not set.",
    },
    usePrettyRefs: {
      label: "Use Pretty Refs?",
      type: "boolean",
      helperText:
        "Pretty refs help you identify when content is embedded from elsewhere and provide links back to the source.",
    },
    config: {
      type: "record",
      label: "Hierarchy Config",
      data: {
        type: "object",
        data: {
          noindexByDefault: {
            type: "boolean",
            label: "No index by default?",
          },
          customFrontmatter: {
            type: "array",
            label: "Custom Frontmatter",
            data: {
              type: "object",
              data: {
                key: {
                  type: "string",
                  label: "Key",
                },
                value: {
                  type: "string",
                  label: "Value",
                },
              },
            },
          },
          publishByDefault: {
            type: "record",
            label: "Publish by default?",
            data: {
              type: "boolean",
            },
          },
        },
      },
    },
    siteHierarchies: {
      type: "array",
      label: "Site Hierarchy",
      required: true,
      data: {
        type: "string",
        label: "Site Config",
        helperText: "Site configuration",
      },
    },
  },
};

const vaultSync: EnumConfig = {
  type: "enum",
  label: "Sync Options",
  data: ["skip", "noPush", "noCommit", "sync"],
};

const vault: ArrayConfig = {
  type: "array",
  label: "Vaults",
  data: {
    type: "object",
    data: {
      fsPath: {
        type: "string",
        label: "Filesystem Path",
        required: true,
        helperText: "Filesystem path to vault",
      },
      visibility: {
        type: "string",
        label: "Visibility",
        helperText: "Visibility of the vault",
      },
      sync: vaultSync,
    },
  },
};

const workspacesConfig: RecordConfig = {
  type: "record",
  label: "Workspaces",
  data: {
    type: "object",
    data: {
      workspaceEntry: {
        type: "string",
        label: "Remote Endpoint",
        helperText: "Remote endpoint for workspaces",
      },
    },
  },
};

const dendronConfig: ObjectConfig = {
  type: "object",
  data: {
    noCaching: {
      label: "No Caching?",
      type: "boolean",
      helperText: "Disable caching behavior",
    },
    noTelemetry: {
      label: "No telemetry?",
      type: "boolean",
      helperText: "Disable telemetry",
    },
    site: siteConfig,
    vaults: vault,
    workspaces: workspacesConfig,
  },
};

export default dendronConfig;
