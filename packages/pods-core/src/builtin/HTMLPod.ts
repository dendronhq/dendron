import { ConfigUtils } from "@dendronhq/common-all";
import { DConfig } from "@dendronhq/common-server";
import { MDUtilsV5 } from "@dendronhq/unified";
import { JSONSchemaType } from "ajv";
import { PublishPod, PublishPodConfig, PublishPodPlantOpts } from "../basev3";
import { PodUtils } from "../utils";

const ID = "dendron.html";

export type HTMLPublishPodConfig = PublishPodConfig & {
  /**
   * check for parsing links(wikilinks and backlinks). Used by gdoc export pod to avoid parsing wikilinks as href.
   */
  convertLinks?: boolean;
  convertTagNotesToLinks?: boolean;
  convertUserNotesToLinks?: boolean;
  enablePrettyRefs?: boolean;
};

export class HTMLPublishPod extends PublishPod<HTMLPublishPodConfig> {
  static id: string = ID;
  static description: string = "publish html";

  get config(): JSONSchemaType<HTMLPublishPodConfig> {
    return PodUtils.createPublishConfig({
      required: [],
      properties: {
        convertLinks: {
          description: "convert Links to href",
          type: "boolean",
          default: true,
          nullable: true,
        },
        convertTagNotesToLinks: {
          type: "boolean",
          default: false,
          nullable: true,
        },
        convertUserNotesToLinks: {
          type: "boolean",
          default: false,
          nullable: true,
        },
        enablePrettyRefs: {
          type: "boolean",
          default: true,
          nullable: true,
        },
      },
    }) as JSONSchemaType<HTMLPublishPodConfig>;
  }

  async plant(opts: PublishPodPlantOpts): Promise<any> {
    const { config, engine, note } = opts;
    const {
      fname,
      convertLinks = true,
      convertTagNotesToLinks = false,
      convertUserNotesToLinks = false,
      enablePrettyRefs = true,
    } = config;
    const econfig = DConfig.readConfigSync(engine.wsRoot);
    const overrideConfig = { ...econfig };

    const workspaceConfig = ConfigUtils.getWorkspace(overrideConfig);
    workspaceConfig.enableUserTags = convertUserNotesToLinks;
    workspaceConfig.enableHashTags = convertTagNotesToLinks;
    const previewConfig = ConfigUtils.getPreview(overrideConfig);
    previewConfig.enablePrettyRefs = enablePrettyRefs;
    const proc = MDUtilsV5.procRehypeFull({
      engine,
      vault: note.vault,
      fname,
      config: overrideConfig,
      wikiLinksOpts: { convertLinks },
    });
    const { contents } = await proc.processSync(note.body);
    return contents as string;
  }
}
