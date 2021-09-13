/**
 * Namespace for configuring {@link InsertNoteCommand}
 */
export type InsertNoteConfig = {
  initialValue: string;
};

/**
 * Generates default {@link InsertNoteConfig}
 * @returns InsertNoteConfig
 */
export function genDefaultInsertNoteConfig(): InsertNoteConfig {
  return {
    initialValue: "templates",
  };
}
