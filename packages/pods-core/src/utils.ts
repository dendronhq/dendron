import {
  DendronError,
  getSlugger,
  genUUIDInsecure,
  ERROR_SEVERITY,
  stringifyError,
} from "@dendronhq/common-all";
import { readYAML } from "@dendronhq/common-server";
import Ajv, { JSONSchemaType } from "ajv";
import addFormats from "ajv-formats";
import fs, { ensureDirSync, writeFileSync } from "fs-extra";
import _ from "lodash";
import path from "path";
import { PodClassEntryV4, PodItemV4 } from "./types";
import { docs_v1 as docsV1 } from "googleapis";
import download from "image-downloader";

export * from "./builtin";
export * from "./types";
export * from "./utils";

const ajv = new Ajv();
addFormats(ajv);

export const podClassEntryToPodItemV4 = (p: PodClassEntryV4): PodItemV4 => {
  return {
    id: p.id,
    description: p.description,
    podClass: p,
  };
};

export class PodUtils {
  static getConfig({
    podsDir,
    podClass,
  }: {
    podsDir: string;
    podClass: PodClassEntryV4;
  }): false | any {
    const podConfigPath = PodUtils.getConfigPath({ podsDir, podClass });
    if (!fs.existsSync(podConfigPath)) {
      return false;
    } else {
      return readYAML(podConfigPath);
    }
  }

  static getConfigPath({
    podsDir,
    podClass,
  }: {
    podsDir: string;
    podClass: PodClassEntryV4;
  }): string {
    return path.join(podsDir, podClass.id, `config.${podClass.kind}.yml`);
  }

  static getPath({
    podsDir,
    podClass,
  }: {
    podsDir: string;
    podClass: PodClassEntryV4;
  }): string {
    return path.join(podsDir, podClass.id);
  }

  static getPodDir(opts: { wsRoot: string }) {
    const podsPath = path.join(opts.wsRoot, "pods");
    return podsPath;
  }

  static createExportConfig(opts: { required: string[]; properties: any }) {
    return {
      type: "object",
      additionalProperties: false,
      required: ["dest", ...opts.required],
      properties: {
        dest: {
          type: "string",
          description: "Where to export to",
        },
        includeBody: {
          type: "boolean",
          default: true,
          description: "should body be included",
          nullable: true,
        },
        includeStubs: {
          type: "boolean",
          description: "should stubs be included",
          nullable: true,
        },
        ignore: { type: "array", items: { type: "string" }, nullable: true },
        vaults: {
          type: "object",
          description: "include or exclude certain vaults",
          nullable: true,
          properties: {
            include: {
              type: "array",
              items: {
                type: "string",
              },
            },
            exclude: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },
        },
        ...opts.properties,
      },
    };
  }

  static createImportConfig(opts: { required: string[]; properties: any }) {
    return {
      type: "object",
      required: ["src", "vaultName", ...opts.required],
      properties: {
        src: {
          type: "string",
          description: "Where to import from",
        },
        vaultName: {
          type: "string",
          description: "name of vault to import into",
        },
        concatenate: {
          type: "boolean",
          description: "whether to concatenate everything into one note",
          nullable: true,
        },
        frontmatter: {
          description: "frontmatter to add to each note",
          type: "object",
          nullable: true,
        },
        fnameAsId: {
          description: "use the file name as the id",
          type: "boolean",
          nullable: true,
        },
        destName: {
          description: "If concatenate is set, name of destination path",
          type: "string",
          nullable: true,
        },
        ...opts.properties,
      },
      if: {
        properties: { concatenate: { const: true } },
      },
      then: {
        dependencies: {
          concatenate: ["destName"],
        },
      },
    };
  }

  static createPublishConfig(opts: { required: string[]; properties: any }) {
    return {
      type: "object",
      required: [...opts.required],
      properties: {
        fname: {
          description: "name of src file",
          type: "string",
        },
        vaultName: {
          description: "name of src vault",
          type: "string",
        },
        dest: {
          description: "where to export to",
          type: "string",
        },
        ...opts.properties,
      },
    };
  }

  /**
   * Create config file if it doesn't exist
   */
  static genConfigFile({
    podsDir,
    podClass,
    force,
  }: {
    podsDir: string;
    podClass: PodClassEntryV4;
    force?: boolean;
  }) {
    const podConfigPath = PodUtils.getConfigPath({ podsDir, podClass });
    ensureDirSync(path.dirname(podConfigPath));
    // eslint-disable-next-line new-cap
    const pod = new podClass();
    const required = pod.config.required;
    const podConfig = pod.config.properties;
    const config = Object.keys(podConfig)
      .map((ent: any) => {
        podConfig[ent] = _.defaults(podConfig[ent], { default: "TODO" });
        const args = [
          `# description: ${podConfig[ent].description}`,
          `# type: ${podConfig[ent].type}`,
        ];
        let configPrefix = "# ";
        if (required.includes(`${ent}`)) {
          args.push(`# required: true`);
          configPrefix = "";
        }
        args.push(`${configPrefix}${ent}: ${podConfig[ent].default}`);
        return args.join("\n");
      })
      .join("\n\n");

    if (!fs.existsSync(podConfigPath) || force) {
      writeFileSync(podConfigPath, config);
    }
    return podConfigPath;
  }

  static validate<T>(config: Partial<T>, schema: JSONSchemaType<T>) {
    const validateConfig = ajv.compile(schema);
    const valid = validateConfig(config);
    if (!valid) {
      const errors = ajv.errorsText(validateConfig.errors);
      throw new DendronError({
        message: `validation errors: ${errors}`,
        payload: `error: ${JSON.stringify(validateConfig.errors)}`,
      });
    }
  }

  static hasRequiredOpts(_pClassEntry: PodClassEntryV4): boolean {
    const pod = new _pClassEntry();
    if (pod.config.required.length > 0) {
      return true;
    }
    let hasReqOpts: boolean = false;
    const properties = pod.config.properties;

    Object.keys(properties).forEach((prop: any) => {
      if (prop.nullable && _.isUndefined(prop.default)) {
        hasReqOpts = true;
      }
    });

    return hasReqOpts;
  }

  static getAnalyticsPayload(opts?: { config: any; podChoice: PodItemV4 }) {
    if (!opts || !opts.config) {
      return {
        configured: false,
      };
    }

    return {
      configured: true,
      podId: opts.podChoice.id,
    };
  }

  /**
   *
   * helper method to parse doc to md
   */
  static googleDocsToMarkdown = (
    file: docsV1.Schema$Document,
    assetDir: string
  ) => {
    let text = "";
    //map of all embedded images
    const imagesMap = new Map<string, string>();

    /**
     * inline and positioned objects contains image properties.
     */
    const inlineObjects = file.inlineObjects;
    const positionedObjects = file.positionedObjects;

    if (inlineObjects) {
      const keys = Object.keys(inlineObjects);
      keys.forEach((key) => {
        const contentUri =
          inlineObjects[key].inlineObjectProperties?.embeddedObject
            ?.imageProperties?.contentUri;
        const id = inlineObjects[key].objectId;
        if (contentUri && id && id !== null) {
          imagesMap.set(id, contentUri);
        }
      });
    }
    if (positionedObjects) {
      const keys = Object.keys(positionedObjects);
      keys.forEach((key) => {
        const contentUri =
          positionedObjects[key].positionedObjectProperties?.embeddedObject
            ?.imageProperties?.contentUri;
        const id = positionedObjects[key].objectId;
        if (contentUri && id && id !== null) {
          imagesMap.set(id, contentUri);
        }
      });
    }

    //iterates over each element of document
    file.body?.content?.forEach((item) => {
      /**
       * Tables
       */
      if (item.table?.tableRows) {
        const cells = item.table.tableRows[0]?.tableCells;
        // Make a blank header
        text += `|${cells?.map(() => "").join("|")}|\n|${cells
          ?.map(() => "-")
          .join("|")}|\n`;
        item.table.tableRows.forEach(({ tableCells }) => {
          const textRows: any[] = [];
          tableCells?.forEach(({ content }) => {
            content?.forEach(({ paragraph }) => {
              const styleType =
                paragraph?.paragraphStyle?.namedStyleType || undefined;
              textRows.push(
                paragraph?.elements?.map((element: any) =>
                  PodUtils.styleElement(element, styleType)
                    ?.replace(/\s+/g, "")
                    .trim()
                )
              );
            });
          });
          text += `| ${textRows.join(" | ")} |\n`;
        });
      }

      /**
       * Paragraphs, lists, horizontal line, images(inline and positioned) and user mentions
       */
      if (item.paragraph && item.paragraph.elements) {
        const styleType =
          item?.paragraph?.paragraphStyle?.namedStyleType || undefined;

        //for bullet
        const bullet = item.paragraph?.bullet;
        if (bullet?.listId) {
          const listDetails = file.lists?.[bullet.listId];
          const glyphFormat =
            listDetails?.listProperties?.nestingLevels?.[0].glyphFormat || "";
          const padding = "  ".repeat(bullet.nestingLevel || 0);
          if (["[%0]", "%0."].includes(glyphFormat)) {
            text += `${padding}1. `;
          } else {
            text += `${padding}- `;
          }
        }
        //for positioned images
        if (item.paragraph.positionedObjectIds) {
          item.paragraph.positionedObjectIds.forEach((id) => {
            const imageUrl = imagesMap.get(id);
            text = PodUtils.downloadImage(imageUrl, assetDir, text);
          });
        }

        item.paragraph.elements.forEach((element: any) => {
          //for paragraph text
          if (
            element.textRun &&
            PodUtils.content(element) &&
            PodUtils.content(element) !== "\n"
          ) {
            text += PodUtils.styleElement(element, styleType);
          }
          //for user mentions
          if (element.person) {
            const slugger = getSlugger();
            const name = slugger.slug(element.person.personProperties.name);
            text += `@${name}`;
          }
          //for horizontal lines
          if (element.horizontalRule) {
            text += "* * *\n";
          }
          // for inline images
          if (element.inlineObjectElement) {
            const imageUrl = imagesMap.get(
              element.inlineObjectElement.inlineObjectId
            );
            text = PodUtils.downloadImage(imageUrl, assetDir, text);
          }
        });
        // eslint-disable-next-line no-nested-ternary
        text += bullet?.listId
          ? (text.split("\n").pop() || "").trim().endsWith("\n")
            ? ""
            : "\n"
          : "\n\n";
      }
    });

    const lines = text.split("\n");
    const linesToDelete: number[] = [];
    lines.forEach((line, index) => {
      if (index > 2) {
        if (
          !line.trim() &&
          ((lines[index - 1] || "").trim().startsWith("1. ") ||
            (lines[index - 1] || "").trim().startsWith("- ")) &&
          ((lines[index + 1] || "").trim().startsWith("1. ") ||
            (lines[index + 1] || "").trim().startsWith("- "))
        )
          linesToDelete.push(index);
      }
    });
    text = text
      .split("\n")
      .filter((_, i) => !linesToDelete.includes(i))
      .join("\n");
    return text.replace(/\n\s*\n\s*\n/g, "\n\n") + "\n";
  };

  /**
   * styles the element: heading, bold and italics
   */
  static styleElement = (
    element: docsV1.Schema$ParagraphElement,
    styleType?: string
  ): string | undefined => {
    if (styleType === "TITLE") {
      return `# ${PodUtils.content(element)}`;
    } else if (styleType === "SUBTITLE") {
      return `_${(PodUtils.content(element) || "").trim()}_`;
    } else if (styleType === "HEADING_1") {
      return `## ${PodUtils.content(element)}`;
    } else if (styleType === "HEADING_2") {
      return `### ${PodUtils.content(element)}`;
    } else if (styleType === "HEADING_3") {
      return `#### ${PodUtils.content(element)}`;
    } else if (styleType === "HEADING_4") {
      return `##### ${PodUtils.content(element)}`;
    } else if (styleType === "HEADING_5") {
      return `###### ${PodUtils.content(element)}`;
    } else if (styleType === "HEADING_6") {
      return `####### ${PodUtils.content(element)}`;
    } else if (
      element.textRun?.textStyle?.bold &&
      element.textRun?.textStyle?.italic
    ) {
      return `**_${PodUtils.content(element)}_**`;
    } else if (element.textRun?.textStyle?.italic) {
      return `_${PodUtils.content(element)}_`;
    } else if (element.textRun?.textStyle?.bold) {
      return `**${PodUtils.content(element)}**`;
    }

    return PodUtils.content(element);
  };

  static content = (
    element: docsV1.Schema$ParagraphElement
  ): string | undefined => {
    const textRun = element?.textRun;
    const text = textRun?.content;
    if (textRun?.textStyle?.link?.url)
      return `[${text}](${textRun.textStyle.link.url})`;
    return text || undefined;
  };

  /**
   * downloads the image from cdn url and stores them in the assets directory inside vault
   */
  static downloadImage = (
    imageUrl: string | undefined,
    assetDir: string,
    text: string
  ): string => {
    fs.ensureDirSync(assetDir);
    if (imageUrl) {
      const uuid = genUUIDInsecure();
      const dest = path.join(assetDir, `image-${uuid}.png`);
      const options = {
        url: imageUrl,
        dest,
      };
      try {
        text += `![image](${path.join("assets", `image-${uuid}.png`)})\n`;
        download.image(options);
      } catch (err: any) {
        throw new DendronError({
          message: stringifyError(err),
          severity: ERROR_SEVERITY.MINOR,
        });
      }
    }
    return text;
  };
}
