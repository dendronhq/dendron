/**
 * Namespace for all global configurations.
 */
export type DendronGlobalConfig = {
  enableFMTitle: boolean; // TODO: split implementation to respect non-global config
  enableNoteTitleForLink: boolean; // TODO: split
  enablePrettyRefs: boolean; // TODO: split
  enableKatex: boolean; // TODO: split
  enableChildLinks: boolean;
  enableBackLinks: boolean;
};

/**
 * Generates default for {@link DendronGlobalConfig}
 * @returns DendronGlobalConfig
 */
export function genDefaultGlobalConfig(): DendronGlobalConfig {
  return {
    enableFMTitle: true, // TODO: split implementation to respect non-global config
    enableNoteTitleForLink: true, // TODO: split
    enableKatex: true,
    enablePrettyRefs: true,
    enableChildLinks: true,
    enableBackLinks: true,
  };
}
