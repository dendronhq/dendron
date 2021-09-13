/**
 * Namespace for configuring {@link InsertNoteIndexCommand}
 */
export type InsertNoteIndexConfig = {
  useMarker: boolean;
};

/**
 * Generates default {@link InsertNoteIndexConfig}
 * @returns InsertNoteIndexConfig
 */
export function genDefaultInsertNoteIndexConfig(): InsertNoteIndexConfig {
  return {
    useMarker: false,
  };
}
