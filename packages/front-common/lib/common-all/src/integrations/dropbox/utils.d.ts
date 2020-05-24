import { Note } from "../../node";
import { files } from "dropbox";
export declare function denddronId2DxId(did: string): string;
export declare function dxId2DendronId(dxId: string): string;
export declare function fileNameToTitle(name: string): string;
export declare function fileNameToTreePath(name: string): string[];
export declare function fileToNote(meta: files.FileMetadata | files.FileMetadataReference | files.FolderMetadataReference, body?: string): Note;
