import {
  ImportPod,
  ImportPodConfig,
  ImportPodPlantOpts,
  PROMPT,
} from "../basev3";
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
// import open from "open";
// import * as queryString from 'query-string';
import fs from "fs-extra";
import path from "path";

const ID = "dendron.gdoc";

type GDocImportPodCustomOpts = {
  /**
   * google docs personal access token
   */
  token: string;
  /**
   * google docs personal refresh token
   */
  refreshToken: string;

  /**
   * document Id of doc to import
   */
  documentId?: string;

  /**
   * name of hierarchy to import into
   */
  hierarchyDestination?: string;

  /**
   * import comments from the doc in text or json format
   */
  importComments?: ImportComments;
  /**
   * get confirmation before overwriting existing note
   */
  confirmOverwrite?: boolean;
};

type ImportComments = {
  enable: boolean;
  format?: string;
};

export type GDocImportPodConfig = ImportPodConfig & GDocImportPodCustomOpts;

export type GDocImportPodPlantOpts = ImportPodPlantOpts;

export class GDocImportPod extends ImportPod<GDocImportPodConfig> {
  static id: string = ID;
  static description: string = "import google doc";

  get config(): JSONSchemaType<GDocImportPodConfig> {
    return PodUtils.createImportConfig({
      required: [],
      properties: {
        hierarchyDestination: {
          type: "string",
          description: "name of hierarchy to import into",
          nullable: true,
        },
        importComments: {
          type: "object",
          nullable: true,
          description: "import comments from the doc in text or json format",
          required: ["enable"],
          properties: {
            enable: {
              type: "boolean",
              default: "false",
            },
            format: {
              type: "string",
              enum: ["json", "text"],
              default: "json",
              nullable: true,
            },
          },
        },
        confirmOverwrite: {
          type: "boolean",
          default: "true",
          description: "get confirmation before overwriting existing note",
          nullable: true,
        },
      },
    }) as JSONSchemaType<GDocImportPodConfig>;
  }

  /**
   * sends request to drive API to fetch docs of mime type document
   */

  sendRequest = async (token: string) => {
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    const result = await axios.get(
      `https://www.googleapis.com/drive/v3/files`,
      {
        params: {
          q: "mimeType= 'application/vnd.google-apps.document'",
        },
        headers,
      }
    );
    return result;
  };

  /**
   * get all documents present in google docs
   */
  getAllDocuments = async (
    token: string,
    wsRoot: string,
    refreshToken: string
  ) => {
    let docIdsHashMap: any;
    const port = fs.readFileSync(path.join(wsRoot, ".dendron.port"), {
      encoding: "utf8",
    });

    let result;
    let newtoken;

    try {
      result = await this.sendRequest(token);
    } catch (err: any) {
      /**
       * send request to refresh access token if the token is expired
       */
      if (err.response?.status === 401) {
        newtoken = await axios.get(
          `http://localhost:${port}/api/oauth/refreshToken`,
          {
            params: {
              refreshToken,
            },
          }
        );
        //makes drive request again to fetch all the documents
        result = await this.sendRequest(newtoken.data);
      } else {
        throw new DendronError({ message: stringifyError(err) });
      }
    }

    const files = result?.data.files;

    //creates HashMap of documents with key as doc name and value as doc id
    files.forEach((file: any) => {
      docIdsHashMap = {
        ...docIdsHashMap,
        [file.name]: file.id,
      };
    });
    return { docIdsHashMap, newtoken: newtoken?.data };
  };

  /*
   * method to get data from google document
   */
  getDataFromGDoc = async (
    opts: Partial<GDocImportPodConfig>,
    config: ImportPodConfig
  ): Promise<Partial<NoteProps>> => {
    let response: Partial<NoteProps>;
    const { documentId, token, hierarchyDestination } = opts;
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    try {
      const result = await axios.get(
        `https://docs.googleapis.com/v1/documents/${documentId}`,
        { headers }
      );
      const markdown = googleDocsToMarkdown(result.data);

      /*
       * to get index of the string after 2nd occurrence of ---
       */
      const index = markdown.indexOf("---", markdown.indexOf("---") + 3) + 3;
      response = {
        body: markdown.substring(index),
        fname: `${hierarchyDestination}`,
        custom: {
          documentId: result.data.documentId,
          revisionId: result.data.revisionId,
          ...config.frontmatter,
        },
      };
    } catch (error: any) {
      this.L.error({
        msg: "failed to import the doc",
        payload: stringifyError(error),
      });
      throw new DendronError({ message: stringifyError(error) });
    }
    return response;
  };

  /*
   * method to get comments in document
   */
  getCommentsFromDoc = async (
    opts: Partial<GDocImportPodConfig>,
    response: Partial<NoteProps>
  ): Promise<Partial<NoteProps>> => {
    let comments;
    const { documentId, token, importComments } = opts;
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    try {
      comments = await axios.get(
        `https://www.googleapis.com/drive/v2/files/${documentId}/comments`,
        { headers }
      );

      const items = comments.data.items;
      if (items.length > 0) {
        comments = items.map((item: any) => {
          let replies;
          if (item.replies.length > 0) {
            replies = item.replies.map((reply: any) => {
              reply = {
                author: reply.author.displayName,
                content: reply.content,
              };
              return reply;
            });
          }
          item = {
            author: item.author.displayName,
            content: item.content,
            replies,
          };
          return item;
        });
        if (importComments?.format === "text") {
          comments = this.prettyComment(comments);
        } else {
          comments = JSON.stringify(comments);
        }
        response.body = response.body?.concat(`### Comments\n\n ${comments}`);
      }
    } catch (error: any) {
      this.L.error({
        msg: "failed to import the comments",
        payload: stringifyError(error),
      });
      throw new DendronError({ message: stringifyError(error) });
    }
    return response;
  };

  /*
   * method to prettify comment if format is text
   */
  prettyComment = (comments: any) => {
    let text: string = "";
    comments.forEach((comment: any) => {
      text += `- ${comment.author}:  ${comment.content}\n`;
      if (comment.replies?.length > 0) {
        text += `\n\t replies to this comment: \n\n`;
        comment.replies.forEach((reply: any) => {
          text += `\t - ${reply.author}: ${reply.content}\n`;
        });
      }
    });
    return text;
  };

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
    if (opts.fnameAsId) {
      entry.id = fname;
    }
    const note = NoteUtils.create({ ...entry, fname, vault });
    return note;
  }

  createNote = async (opts: {
    note: NoteProps;
    engine: DEngineClient;
    wsRoot: string;
    vault: DVault;
    confirmOverwrite?: boolean;
    onPrompt?: (arg0?: PROMPT) => Promise<{ title: string } | undefined>;
  }) => {
    const { note, engine, wsRoot, vault, confirmOverwrite, onPrompt } = opts;
    const existingNote = NoteUtils.getNoteByFnameV5({
      fname: note.fname,
      notes: engine.notes,
      vault,
      wsRoot,
    });
    if (!_.isUndefined(existingNote)) {
      if (
        existingNote.custom.revisionId &&
        existingNote.custom.revisionId !== note.custom.revisionId
      ) {
        existingNote.custom.revisionId = note.custom.revisionId;
        existingNote.body = note.body;

        if (confirmOverwrite && onPrompt) {
          const resp = await onPrompt(PROMPT.USERPROMPT);

          if (resp?.title.toLowerCase() === "yes") {
            await engine.writeNote(existingNote, { newNode: true });
            return existingNote;
          }
        } else {
          await engine.writeNote(existingNote, { newNode: true });
          return existingNote;
        }
      } else if (onPrompt) {
        onPrompt();
      }
    } else {
      await engine.writeNote(note, { newNode: true });
      return note;
    }
    return undefined;
  };

  async plant(opts: GDocImportPodPlantOpts) {
    const ctx = "GDocPod";

    this.L.info({ ctx, opts, msg: "enter" });
    const {
      wsRoot,
      engine,
      vault,
      config,
      onPrompt,
      utilityMethods,
    } = opts;

    const {
      refreshToken,
      fnameAsId,
      importComments,
      confirmOverwrite = true,
    } = config as GDocImportPodConfig;

    let { token } = config as GDocImportPodConfig;

    const { docIdsHashMap, newtoken } = await this.getAllDocuments(
      token,
      wsRoot,
      refreshToken
    );
    if (_.isEmpty(docIdsHashMap)) {
      throw new DendronError({
        message: "No documents present in google docs",
      });
    }
    if (!_.isUndefined(newtoken)) {
      token = newtoken;
    }
    /** document selected by user */
    const documentChoice = await utilityMethods?.showDocumentQuickPick(Object.keys(docIdsHashMap))
  
    if (_.isUndefined(documentChoice)) {
      return { importedNotes: [] };
    }

    const documentId = docIdsHashMap[documentChoice.label];
    const cachedLabel = await utilityMethods?.getGlobalState(documentChoice.label);
    const defaultChoice = _.isUndefined(cachedLabel) ? documentChoice.label : cachedLabel;
    
    /**hierarchy destination entered by user */
    const hierarchyDestination =  await utilityMethods?.getHierarchyDest(defaultChoice)
      
    if (_.isUndefined(hierarchyDestination)) {
      return { importedNotes: [] };
    }

    /**updates global state with key as document name and value as latest hierarchy selected by user */
    await utilityMethods?.updateGlobalState({
      key: documentChoice.label,
      value: hierarchyDestination,
    });

    let response = await this.getDataFromGDoc(
      { documentId, token, hierarchyDestination },
      config
    );

    if (importComments?.enable) {
      response = await this.getCommentsFromDoc(
        { documentId, token, importComments },
        response
      );
    }
    const note: NoteProps = await this._docs2Notes(response, {
      vault,
      fnameAsId,
    });
    const createdNotes = await this.createNote({
      note,
      engine,
      wsRoot,
      vault,
      confirmOverwrite,
      onPrompt,
    });

    const importedNotes: NoteProps[] = createdNotes === undefined ? [] : [createdNotes];
    utilityMethods?.openFileInEditor(importedNotes[0]);
    return { importedNotes };
  }
}
