import { Note } from "../../node";
import { files } from "dropbox";
import path from "path";

export function denddronId2DxId(did: string): string {
  return `id:${did}`;
}
export function dxId2DendronId(dxId: string): string {
  return dxId.slice(3);
}

export function fileNameToTitle(name: string): string {
  const ext = path.extname(name);
  return path.basename(name, ext);
}

export function fileNameToTreePath(name: string): string[] {
  const title = fileNameToTitle(name);
  return title.split(".");
}

export function fileToNote(
  meta:
    | files.FileMetadata
    | files.FileMetadataReference
    | files.FolderMetadataReference,
  body?: string
) {
  const title = fileNameToTitle(meta.name);
  const id = dxId2DendronId(meta.id);
  const note = new Note({
    id,
    title,
    desc: "TODO",
    type: "note",
    schemaId: "-1",
    body
  });
  return note;
}
