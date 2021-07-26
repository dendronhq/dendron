import { ImportPod, ImportPodConfig, ImportPodPlantOpts } from "../basev3";
import { JSONSchemaType } from "ajv";
import { PodUtils } from "../utils";
import axios from "axios";
import { googleDocsToMarkdown } from "docs-markdown";
import _ from "lodash";
import {
  DendronError,
  DVault,
  NoteProps,
  NoteUtils,
  stringifyError,
  DEngineClient,
} from "@dendronhq/common-all";
import { window } from "vscode";

const ID = "dendron.gdoc";

type GDocImportPodCustomOpts = {
  /**
   * google docs personal access token
   */
  token: string;

   /**
   * document Id of doc to import
   */
  documentId: string;

  /**
   * name of hierarchy to import into
   */
   hierarchyDestination: string;

   /**
   * import comments from the doc in text or json format
   */
  importComments? : ImportComments;
  /**
   * get confirmation before overwriting existing note
   */
   confirmOverwrite? : boolean;
};

type ImportComments = {
  enable: boolean;
  format?: string;
}

type GDocImportPodConfig = ImportPodConfig & GDocImportPodCustomOpts;

export type GDocImportPodPlantOpts = ImportPodPlantOpts;

export class GDocImportPod extends ImportPod<GDocImportPodConfig> {
  static id: string = ID;
  static description: string = "import google doc";

  get config(): JSONSchemaType<GDocImportPodConfig> {
    return PodUtils.createImportConfig({
      required: ["token", "hierarchyDestination", "documentId"],
      properties: {
        token: {
          type: "string",
          description: "google docs personal access token",
        },
        documentId: {
          type: "string",
          description: "document Id of doc to import",
        },
        hierarchyDestination: {
          type: "string",
          description: "name of hierarchy to import into",
        },
        importComments: {
          type: "object",
          nullable: true,
          description: "import comments from the doc in text or json format",
          required : ["enable"],
          properties: {
            enable: {
              type: "boolean",
              default: "false"
            },
            format: {
              type: "string",
              enum: ["json","text"],
              default: "json",
              nullable: true,

            }
          }
        },
        confirmOverwrite: {
          type: "boolean",
          default: "true",
          description: "get confirmation before overwriting existing note",
          nullable: true
        },
      },
    }) as JSONSchemaType<GDocImportPodConfig>;
  }

  /*
   * method to get data from google document
   */
  getDataFromGDoc = async (opts: Partial<GDocImportPodConfig>, 
    config: ImportPodConfig
    ): Promise<Partial<NoteProps>>  => {
    let response: Partial<NoteProps>;
    const {documentId, token, hierarchyDestination } = opts;
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    try{
      const result = await axios.get(
        `https://docs.googleapis.com/v1/documents/${documentId}`,
        { headers }
      )
      const markdown = googleDocsToMarkdown(result.data);

      /*
      * to get index of the string after 2nd occurrence of ---
      */
      const index= markdown.indexOf("---", markdown.indexOf("---") + 3) + 3;
       response = {
        body: markdown.substring(index),
        fname: `${hierarchyDestination}.${result.data.title}`,
        custom: {
          documentId: result.data.documentId,
          revisionId: result.data.revisionId,
          ...config.frontmatter
        }
      }
    }catch(error){
      this.L.error({
        msg: "failed to import the doc",
        payload: stringifyError(error),
      });
      if(error.response?.status === 401) {
        throw new DendronError({ message: "access token expired or is incorrect." });
      }
      throw new DendronError({ message: stringifyError(error) });
    }
   return response;

  }

  /*
   * method to get comments in document
   */
  getCommentsFromDoc = async(opts: Partial<GDocImportPodConfig>, 
    response: Partial<NoteProps>) : Promise<Partial<NoteProps>> => {

    let comments;
    const {documentId, token, importComments } = opts;
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    try {
    comments = await axios.get(`https://www.googleapis.com/drive/v2/files/${documentId}/comments`,
    {headers});
    
    const items= comments.data.items;
    if(items.length > 0) {
    comments = items.map((item: any) => {
      let replies;
      if(item.replies.length > 0){
       replies = item.replies.map((reply: any) => {
        reply = {
          author: reply.author.displayName,
          content: reply.content
        };
        return reply;
       })
      }
       item = {
          author: item.author.displayName,
          content: item.content,
          replies
        };
        return item;
      })
      if(importComments?.format === "text")
      {
        comments = this.prettyComment(comments);
      }
      else {
        comments= JSON.stringify(comments)
      }
       response.body = response.body?.concat(`### Comments\n\n ${comments}`)
    }
  }catch(error) {
    this.L.error({
      msg: "failed to import the comments",
      payload: stringifyError(error),
    });
    throw new DendronError({ message: stringifyError(error) });
  }
  return response;
  }
  
  /*
   * method to prettify comment if format is text
   */
  prettyComment = (comments: any) => {
    let text: string = "";
    comments.forEach((comment: any) => {
       text += `- ${comment.author}:  ${comment.content}\n`
       if(comment.replies?.length> 0){
         text += `\n\t replies to this comment: \n\n`
         comment.replies.forEach((reply: any) => {
          text += `\t - ${reply.author}: ${reply.content}\n`

         })
       }
    })
    return text;
  }

  async _docs2Notes(
    entry: Partial<NoteProps>,
    opts: Pick<ImportPodConfig, "fnameAsId"> & {
      vault: DVault;
    }
  ) {
    const { vault } = opts;
    if (!entry.fname) {
      throw Error("fname not defined");
    }
    const fname = entry.fname;
    if(opts.fnameAsId) {
      entry.id = fname
    }
    const note= NoteUtils.create({ ...entry, fname, vault });
    return note;
  }

  createNote= async( opts : {
    note: NoteProps,
    engine: DEngineClient,
    wsRoot: string,
    vault: DVault,
    confirmOverwrite?: boolean}
  ) => {
     const { note, engine, wsRoot, vault, confirmOverwrite } = opts;
      const existingNote = NoteUtils.getNoteByFnameV5({
      fname: note.fname,
      notes: engine.notes,
      vault,
      wsRoot,
    });
    if (!_.isUndefined(existingNote)) {
        if(existingNote.custom.revisionId && existingNote.custom.revisionId !== note.custom.revisionId) {
          existingNote.custom.revisionId = note.custom.revisionId;
          existingNote.body = note.body;

          if(confirmOverwrite){
          const resp = await window.showInformationMessage(
              "Do you want to overwrite",
                { modal: true },
                { title: "Yes" }
              );

            if(resp?.title === "Yes"){
              await engine.writeNote(existingNote, { newNode: true });
              return existingNote;

            }  
          }
          else{
            await engine.writeNote(existingNote, { newNode: true });
            return existingNote;
          }
        }else {
          window.showInformationMessage("Note is already in sync with the google doc")
        }
    }
    else {
      await engine.writeNote(note, { newNode: true });
      return note;
    }
    return undefined;
  }

  async plant(opts: GDocImportPodPlantOpts) {
    const ctx = "GDocPod";
    this.L.info({ ctx, opts, msg: "enter" });
    const { wsRoot, engine, vault, config } = opts;
    const {
      token,
      hierarchyDestination,
      documentId,
      fnameAsId,
      importComments,
      confirmOverwrite = true
    } = config as GDocImportPodConfig;

    let response = await this.getDataFromGDoc({documentId, token, hierarchyDestination}, config)
    if(importComments?.enable) {
     response = await this.getCommentsFromDoc({documentId, token, importComments}, response)

    }
    const note: NoteProps = await this._docs2Notes(response, {
      vault,
      fnameAsId
    });
    const createdNotes = await this.createNote({note, engine, wsRoot, vault, confirmOverwrite})
    const importedNotes: NoteProps[] = (createdNotes === undefined) ? [] : [createdNotes]

    return { importedNotes };
  }
}
