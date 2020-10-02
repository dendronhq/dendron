import {
  DNodeUtilsV2,
  NotePropsV2,
  NoteUtilsV2,
  SchemaModuleOptsV2,
  SchemaUtilsV2,
} from "@dendronhq/common-all";
import fs from "fs-extra";
import matter from "gray-matter";
import YAML from "js-yaml";
import path from "path";

export function file2Note(fpath: string): NotePropsV2 {
  const options: any = {
    engines: {
      yaml: {
        parse: (s: string) => YAML.safeLoad(s, { schema: YAML.JSON_SCHEMA }),
        stringify: (s: string) =>
          YAML.safeDump(s, { schema: YAML.JSON_SCHEMA }),
      },
    },
  };
  const { data, content: body } = matter(
    fs.readFileSync(fpath, { encoding: "utf8" }),
    options
  );
  const { name: fname } = path.parse(fpath);
  return DNodeUtilsV2.create({ ...data, fname, body, type: "note" });
}

export function note2File(note: NotePropsV2, vaultPath: string) {
  const { fname } = note;
  const ext = ".md";
  return fs.writeFile(
    path.join(vaultPath, fname + ext),
    NoteUtilsV2.serialize(note)
  );
}

export function schemaModule2File(
  schemaFile: SchemaModuleOptsV2,
  vaultPath: string,
  fname: string
) {
  const ext = ".schema.yml";
  return fs.writeFile(
    path.join(vaultPath, fname + ext),
    SchemaUtilsV2.serializeModule(schemaFile)
  );
}
