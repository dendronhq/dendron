import {
  ConfigService,
  ConfigUtils,
  NoteDictsUtils,
  URI,
} from "@dendronhq/common-all";
import { getParsingDependencyDicts, MDUtilsV5 } from "@dendronhq/unified";
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
    const configReadResult = await ConfigService.instance().readConfig(
      URI.file(engine.wsRoot)
    );
    if (configReadResult.isErr()) {
      throw configReadResult.error;
    }
    const econfig = configReadResult.value;
    const overrideConfig = { ...econfig };

    const workspaceConfig = ConfigUtils.getWorkspace(overrideConfig);
    workspaceConfig.enableUserTags = convertUserNotesToLinks;
    workspaceConfig.enableHashTags = convertTagNotesToLinks;
    const previewConfig = ConfigUtils.getPreview(overrideConfig);
    previewConfig.enablePrettyRefs = enablePrettyRefs;
    const noteCacheForRenderDict = await getParsingDependencyDicts(
      note,
      engine,
      config,
      config.vaults
    );

    // Also include children to render the 'children' hierarchy at the footer of the page:
    await Promise.all(
      note.children.map(async (childId) => {
        // TODO: Can we use a bulk get API instead (if/when it exists) to speed
        // up fetching time
        const childNote = await engine.getNote(childId);

        if (childNote.data) {
          NoteDictsUtils.add(childNote.data, noteCacheForRenderDict);
        }
      })
    );

    const proc = MDUtilsV5.procRehypeFull({
      noteToRender: note,
      noteCacheForRenderDict,
      vault: note.vault,
      vaults: engine.vaults,
      wsRoot: engine.wsRoot,
      fname,
      config: overrideConfig,
      wikiLinksOpts: { convertLinks },
    });
    const { contents } = await proc.processSync(note.body);
    return contents as string;
  }
}
