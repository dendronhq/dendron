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
  fname: string;
};


type GDocImportPodConfig = ImportPodConfig & GDocImportPodCustomOpts;

export type GDocImportPodPlantOpts = ImportPodPlantOpts;

export class GDocImportPod extends ImportPod<GDocImportPodConfig> {
  static id: string = ID;
  static description: string = "import google doc";

  get config(): JSONSchemaType<GDocImportPodConfig> {
    return PodUtils.createImportConfig({
      required: ["token", "fname", "documentId"],
      properties: {
        token: {
          type: "string",
          description: "google docs personal access token",
        },
        documentId: {
          type: "string",
          description: "document Id of doc to import",
        },
        fname: {
          type: "string",
          description: "name of hierarchy to import into",
        },
      },
    }) as JSONSchemaType<GDocImportPodConfig>;
  }

  getDataFromGDoc = async (opts: Partial<GDocImportPodConfig>): Promise<Partial<NoteProps>>  => {
    let response: Partial<NoteProps>;
    const {documentId, token } = opts;
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
      const body= markdown.split("---")
       response = {
        title: result.data.title,
        body: body[2],
        custom: {
          documentId: result.data.documentId,
          revisionId: result.data.revisionId
        }
      }

    }catch(error){
      this.L.error({
        msg: "failed to import the doc",
        payload: stringifyError(error),
      });
      if(error.response.status === 401) {
        throw new DendronError({ message: "access token expired or is incorrect." });
      }
      throw new DendronError({ message: stringifyError(error) });
    }
   return response;

  }
  
  /*
   * method to add fromtmatter to notes: url, status and tags
   */
  addFrontMatterToData = ( 
    response: Partial<NoteProps>,
    fname: string,
    config: ImportPodConfig
    ): Partial<NoteProps> => {
      response = {
        ...response,
        fname: `${fname}-${response.title}`,
        custom: {
          ...response.custom,
          ...config.frontmatter,
        } 
      }
   return response;
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

  createNote= async(
    note: NoteProps,
    engine: DEngineClient,
    wsRoot: string,
    vault: DVault
  ) => {
      const n = NoteUtils.getNoteByFnameV5({
      fname: note.fname,
      notes: engine.notes,
      vault,
      wsRoot,
    });
    if (!_.isUndefined(n)) {
      if(n.custom.revisionId && n.custom.revisionId !== note.custom.revisionId) {
        n.custom.revisionId = note.custom.revisionId;
        n.body = note.body;
        await engine.writeNote(n, { newNode: true });
        }   
       }
    else {
      await engine.writeNote(note, { newNode: true });
    }
  }

  async plant(opts: GDocImportPodPlantOpts) {
    const ctx = "GDocPod";
    this.L.info({ ctx, opts, msg: "enter" });
    const { wsRoot, engine, vault, config } = opts;
    const {
      token,
      fname,
      documentId,
      fnameAsId
    } = config as GDocImportPodConfig;

    let response = await this.getDataFromGDoc({documentId, token})
    response = this.addFrontMatterToData(response, fname, config);
    const note: NoteProps = await this._docs2Notes(response, {
      vault,
      fnameAsId
    });
    this.createNote(note, engine, wsRoot, vault)
    return { importedNotes: [note] };
  }
}
