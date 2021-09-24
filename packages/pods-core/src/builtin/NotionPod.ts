import { DendronError, ERROR_SEVERITY, NoteProps } from "@dendronhq/common-all";
import { markdownToBlocks } from "@instantish/martian";
import type {
  Page,
  TitlePropertyValue,
} from "@notionhq/client/build/src/api-types";
import { Client } from "@notionhq/client";
import _ from "lodash";
import { ExportPod, ExportPodPlantOpts, ExportPodConfig } from "../basev3";
import { JSONSchemaType } from "ajv";
import { NotionUtilMethods, PodUtils } from "../utils";
import { RateLimiter } from "limiter";

const ID = "dendron.notion";

// Allow 3 req/sec (the Notion API limit). Also understands 'hour', 'minute', 'day', or a no. of ms
// @ts-ignore
const limiter = new RateLimiter({ tokensPerInterval: 3, interval: "second" });

type NotionExportPodCustomOpts = {
  apiKey: string;
  vault: string;
};

export type NotionExportConfig = ExportPodConfig & NotionExportPodCustomOpts;

export class NotionExportPod extends ExportPod<NotionExportConfig> {
  static id: string = ID;
  static description: string = "export notes to notion";

  get config(): JSONSchemaType<NotionExportConfig> {
    return PodUtils.createExportConfig({
      required: ["apiKey", "vault"],
      properties: {
        apiKey: {
          type: "string",
          description: "Api key for Notion",
        },
        vault: {
          type: "string",
          description: "vault to export from",
        },
      },
    }) as JSONSchemaType<NotionExportConfig>;
  }

  /**
   * Method to create pages in Notion
   */
  createPagesInNotion = async (blockPagesArray: any, notion: Client) => {
    blockPagesArray.forEach(async (block: any) => {
      // @ts-ignore
      await limiter.removeTokens(1);
      try {
        await notion.pages.create(block);
      } catch (error) {
        throw new DendronError({
          message: "Failed to export all the notes. " + JSON.stringify(error),
          severity: ERROR_SEVERITY.MINOR,
        });
      }
    });
  };

  /**
   * Method to convert markdown to Notion Block
   */
  convertMdToNotionBlock = (notes: NoteProps[], pageId: string) => {
    const notionBlock = notes.map((note) => {
      const children = markdownToBlocks(note.body);
      return {
        parent: {
          page_id: pageId,
        },
        properties: {
          title: {
            title: [{ type: "text", text: { content: note.title } }],
          },
        },
        children,
      };
    });
    return notionBlock;
  };

  /**
   * Method to get page name of a Notion Page
   */
  getPageName = (page: Page) => {
    const { title } =
      page.parent.type !== "database_id"
        ? (page.properties.title as TitlePropertyValue)
        : (page.properties.Name as TitlePropertyValue);
    return title[0] ? title[0].plain_text : "Untitled";
  };

  /**
   * Method to get all the pages from Notion
   */
  getAllNotionPages = async (notion: Client, progressOpts: any) => {
    const { token, showMessage } = progressOpts;
    token.onCancellationRequested(() => {
      showMessage("Cancelled..");
      return;
    });
    const allDocs = await notion.search({
      sort: { direction: "descending", timestamp: "last_edited_time" },
      filter: { value: "page", property: "object" },
    });
    const pagesMap: any = {};
    const pages = allDocs.results as Page[];
    pages.forEach((page: Page) => {
      const key = this.getPageName(page);
      const value = page.id;
      pagesMap[key] = value;
    });
    return pagesMap;
  };

  async plant(opts: ExportPodPlantOpts) {
    const { config, utilityMethods } = opts;
    const { getSelectionFromQuickpick, withProgressOpts } =
      utilityMethods as NotionUtilMethods;
    const { apiKey, vault } = config as NotionExportConfig;
    let { notes } = opts;

    notes = notes.filter((note) => note.vault.fsPath === vault);
    // Initializing a client
    const notion = new Client({
      auth: apiKey,
    });

    const pagesMap = await withProgressOpts.withProgress(
      {
        location: withProgressOpts.location,
        title: "importing parent pages",
        cancellable: true,
      },
      async (progress: any, token: any) => {
        return this.getAllNotionPages(notion, {
          progress,
          token,
          showMessage: withProgressOpts.showMessage,
        });
      }
    );
    if (_.isUndefined(pagesMap)) {
      return { notes: [] };
    }
    const selectedPage = await getSelectionFromQuickpick(Object.keys(pagesMap));
    if (_.isUndefined(selectedPage)) {
      return { notes: [] };
    }
    const pageId = pagesMap[selectedPage];
    const blockPagesArray = this.convertMdToNotionBlock(notes, pageId);
    await this.createPagesInNotion(blockPagesArray, notion);
    return { notes };
  }
}
