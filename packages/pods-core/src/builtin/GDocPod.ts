import {
  ImportPod,
  ImportPodConfig,
  ImportPodPlantOpts,
  PROMPT,
} from "../basev3";
import { JSONSchemaType } from "ajv";
import { GDocUtilMethods, PodUtils } from "../utils";
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
  Time,
} from "@dendronhq/common-all";
import fs from "fs-extra";
import path from "path";

const ID = "dendron.gdoc";

type GDocImportPodCustomOpts = {
  /**
   * google docs personal access token
   */
  accessToken: string;
  /**
   * google docs personal refresh token
   */
  refreshToken: string;
  /**
   * expiration time of access token
   */
  expirationTime: number;
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

enum ErrMsg {
  TIMEOUT = "timeout",
}

export type GDocImportPodConfig = ImportPodConfig & GDocImportPodCustomOpts;

export type GDocImportPodPlantOpts = ImportPodPlantOpts;

export class GDocImportPod extends ImportPod<GDocImportPodConfig> {
  static id: string = ID;
  static description: string = "import google doc";

  get config(): JSONSchemaType<GDocImportPodConfig> {
    return PodUtils.createImportConfig({
      required: ["accessToken", "refreshToken"],
      properties: {
        accessToken: {
          type: "string",
          description: "google docs personal access token",
        },
        refreshToken: {
          type: "string",
          description: "google docs personal refresh token",
        },
        expirationTime: {
          type: "number",
          description: "expiration time of access token",
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
   * sends Request to drive API to get document id of the document name
   */
  getDocumentId = async (accessToken: string, documentName: string) => {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
    };
    let response: string;
    try {
      const result = await axios.get(
        `https://www.googleapis.com/drive/v3/files`,
        {
          params: {
            q: `mimeType= 'application/vnd.google-apps.document' and name = '${documentName}'`,
          },
          headers,
        }
      );

      response = result.data.files[0]?.id;
    } catch (err: any) {
      throw new DendronError({ message: stringifyError(err) });
    }
    return response;
  };

  /**
   * sends request to drive API to fetch docs of mime type document
   */

  fetchDocListFromDrive = async (accessToken: string) => {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
    };
    const result = await axios.get(
      `https://www.googleapis.com/drive/v3/files`,
      {
        params: {
          q: "mimeType= 'application/vnd.google-apps.document'",
        },
        headers,
        timeout: 5000,
      }
    );
    return result;
  };

  /**
   * gets all document List present in google docs and create HashMap of doc Id and Name
   */
  getAllDocuments = async (accessToken: string) => {
    let docIdsHashMap: any;

    let result;
    let error;
    try {
      result = await this.fetchDocListFromDrive(accessToken);
    } catch (err: any) {
      if (err.code === "ECONNABORTED") {
        result = ErrMsg.TIMEOUT;
      } else {
        throw new DendronError({ message: stringifyError(err) });
      }
    }

    if (result === ErrMsg.TIMEOUT) {
      error = ErrMsg.TIMEOUT;
    } else {
      const files = result?.data.files;

      //creates HashMap of documents with key as doc name and value as doc id
      files.forEach((file: any) => {
        docIdsHashMap = {
          ...docIdsHashMap,
          [file.name]: file.id,
        };
      });
    }

    return { docIdsHashMap, error };
  };

  /*
   * method to get data from google document
   */
  getDataFromGDoc = async (
    opts: {
      documentId: string;
      hierarchyDestination: string;
      accessToken: string;
    },
    config: ImportPodConfig
  ): Promise<Partial<NoteProps>> => {
    let response: Partial<NoteProps>;
    const { documentId, accessToken, hierarchyDestination } = opts;
    const headers = {
      Authorization: `Bearer ${accessToken}`,
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
    opts: Partial<GDocImportPodConfig> & { documentId: string },
    response: Partial<NoteProps>
  ): Promise<Partial<NoteProps>> => {
    let comments;
    const { documentId, accessToken, importComments } = opts;
    const headers = {
      Authorization: `Bearer ${accessToken}`,
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
      throw new DendronError({ message: "fname not defined" });
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
    const { wsRoot, engine, vault, config, onPrompt, utilityMethods } = opts;
    const {
      showDocumentQuickPick,
      openFileInEditor,
      getGlobalState,
      updateGlobalState,
      showInputBox,
    } = utilityMethods as GDocUtilMethods;

    const {
      refreshToken,
      fnameAsId,
      importComments,
      confirmOverwrite = true,
      expirationTime,
    } = config as GDocImportPodConfig;

    let { accessToken } = config as GDocImportPodConfig;

    /** refreshes token if token has already expired */
    if (Time.now().toSeconds() > expirationTime) {
      const port = fs.readFileSync(path.join(wsRoot, ".dendron.port"), {
        encoding: "utf8",
      });
      try {
        const result = await axios.get(
          `http://localhost:${port}/api/oauth/refreshToken`,
          {
            params: {
              refreshToken,
              service: "google",
            },
          }
        );
        accessToken = result.data;
      } catch (err: any) {
        throw new DendronError({ message: stringifyError(err) });
      }
    }

    const hierarchyDestOptions = {
      ignoreFocusOut: true,
      placeHolder: "Destination name here",
      title: "Hierarchy destination",
      prompt: "Enter the destination to import into ",
    };
    const documentIdOptions = {
      ignoreFocusOut: true,
      placeHolder: "Document ID here",
      title: "Document ID",
      prompt: "Request Timed Out. Enter the document Name",
    };
    const { docIdsHashMap, error } = await this.getAllDocuments(accessToken);

    if (_.isEmpty(docIdsHashMap) && _.isUndefined(error)) {
      throw new DendronError({
        message: "No documents present in google docs",
      });
    }

    /** document selected by user */
    const documentChoice = _.isUndefined(error)
      ? await showDocumentQuickPick(Object.keys(docIdsHashMap))
      : await showInputBox(documentIdOptions);
    if (_.isUndefined(documentChoice)) {
      return { importedNotes: [] };
    }

    const documentId =
      typeof documentChoice !== "string"
        ? docIdsHashMap[documentChoice.label]
        : await this.getDocumentId(accessToken, documentChoice);

    if (_.isUndefined(documentId)) {
      throw new DendronError({
        message: "No document present in google docs with this name",
      });
    }

    const cacheOption =
      typeof documentChoice !== "string"
        ? documentChoice.label
        : documentChoice;
    const cachedLabel = await getGlobalState(cacheOption);
    const defaultChoice = _.isUndefined(cachedLabel)
      ? cacheOption
      : cachedLabel;

    /**hierarchy destination entered by user */
    const hierarchyDestination = await showInputBox(
      hierarchyDestOptions,
      defaultChoice
    );

    if (_.isUndefined(hierarchyDestination)) {
      return { importedNotes: [] };
    }

    /**updates global state with key as document name and value as latest hierarchy selected by user */
    await updateGlobalState({
      key: cacheOption,
      value: hierarchyDestination,
    });

    let response = await this.getDataFromGDoc(
      { documentId, accessToken, hierarchyDestination },
      config
    );
    if (importComments?.enable) {
      response = await this.getCommentsFromDoc(
        { documentId, accessToken, importComments },
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

    const importedNotes: NoteProps[] =
      createdNotes === undefined ? [] : [createdNotes];
    if (importedNotes.length > 0) openFileInEditor(importedNotes[0]);
    return { importedNotes };
  }
}
