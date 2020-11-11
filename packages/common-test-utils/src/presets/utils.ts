import { NodeTestUtilsV2 } from "..";

export class NotePresetsUtils {
  static async createBasic({
    vaultDir,
    fname,
  }: {
    fname: string;
    vaultDir: string;
  }) {
    await NodeTestUtilsV2.createSchemas({ vaultPath: vaultDir });
    await NodeTestUtilsV2.createNotes({ vaultPath: vaultDir });
    await NodeTestUtilsV2.createNoteProps({
      vaultPath: vaultDir,
      rootName: fname,
    });
    await NodeTestUtilsV2.createSchemaModuleOpts({
      vaultDir: vaultDir,
      rootName: fname,
    });
  }
}
