import {
  NotePropsV2,
  NoteUtilsV2,
  SchemaModulePropsV2,
  SchemaUtilsV2,
} from "@dendronhq/common-all";
import fs from "fs-extra";
import path from "path";

export function note2File(note: NotePropsV2, vaultPath: string) {
  const { fname } = note;
  const ext = ".md";
  return fs.writeFile(
    path.join(vaultPath, fname + ext),
    NoteUtilsV2.serialize(note)
  );
}

export function schemaModule2File(
  schemaFile: SchemaModulePropsV2,
  vaultPath: string,
  fname: string
) {
  const ext = ".schema.yml";
  return fs.writeFile(
    path.join(vaultPath, fname + ext),
    SchemaUtilsV2.serializeModule(schemaFile)
  );
}
