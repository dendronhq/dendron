import {
  DEngineStore,
  NodeGetResp,
  NodeQueryResp,
  QueryOpts,
  Scope
} from "../types";
import { Dropbox, files } from "dropbox";

import { Note } from "../node";
import _ from "lodash";
import { makeResponse } from "../helpers";
import path from "path";

require("isomorphic-fetch");

function binaryToUtf8(data: any): string {
  const fileBuffer = new Buffer(data, "binary");
  return fileBuffer.toString("utf8");
}

export interface ListFolderResultSimple {
  /**
   * The files and (direct) subfolders in the folder.
   */
  entries: Array<files.FileMetadataReference | files.FolderMetadataReference>;
  /**
   * Pass the cursor into listFolderContinue() to see what's changed in the
   * folder since your previous query.
   */
  cursor: files.ListFolderCursor;
  /**
   * If true, then there are more entries available. Pass the cursor to
   * listFolderContinue() to retrieve the rest.
   */
  has_more: boolean;
}

export class DropboxStorage implements DEngineStore {
  private client: Dropbox;
  constructor() {
    this.client = new Dropbox({
      // TODO: don't hardcode
      accessToken:
        "AxthRhvjDPAAAAAAAACiPVhX_A4isFrjeyDXsV8H1yqARcM9fCInltiA0eZukImA"
    });
  }

  _fileToNote(
    meta:
      | files.FileMetadata
      | files.FileMetadataReference
      | files.FolderMetadataReference,
    body?: string
  ) {
    const ext = path.extname(meta.name);
    const title = path.basename(meta.name, ext);
    // remove id: prefix
    const id = meta.id.slice(3);
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

  async get(_scope: Scope, id: string, opts?: QueryOpts): Promise<NodeGetResp> {
    opts = _.defaults(opts || {}, {});

    let resp: files.FileMetadata & { fileBlob: any; fileBinary: any };
    // check if root
    if (id === "root") {
      // @ts-ignore
      resp = await this.client.filesDownload({ path: `/root.md` });
    } else {
      // @ts-ignore
      resp = await this.client.filesDownload({ path: `id:${id}` });
    }
    console.log({ resp });
    let body: string = "Empty Doc";
    if (opts?.hints?.webClient) {
      body = await resp.fileBlob.text();
    } else {
      body = binaryToUtf8(resp.fileBinary);
    }
    const data = this._fileToNote(resp, body);
    return {
      data
    };
  }

  async query(
    _scope: Scope,
    queryString: string,
    _opts?: QueryOpts
  ): Promise<NodeQueryResp> {
    if (queryString === "**/*") {
      const resp = (await this.client.filesListFolder({
        path: ""
      })) as ListFolderResultSimple;
      const data = resp.entries.map(ent => this._fileToNote(ent));
      return makeResponse<NodeQueryResp>({ data: data, error: null });
    } else {
      throw `unsupported ${queryString}`;
    }
  }
}

// dbx
//   .filesListFolder({ path: "" })
//   .then(function(response) {
//     console.log(response);
//   })
//   .catch(function(error) {
//     console.log(error);
//   });
