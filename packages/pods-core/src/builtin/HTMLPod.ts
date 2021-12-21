import { DendronASTDest, MDUtilsV4 } from "@dendronhq/engine-server";
import { PublishPodPlantOpts, PublishPod, PublishPodConfig } from "../basev3";
import { JSONSchemaType } from "ajv";
import { PodUtils } from "../utils";
import { ConfigUtils } from "@dendronhq/common-all";

const ID = "dendron.html";

export type HTMLPublishPodConfig = PublishPodConfig & {
  /**
   * check for parsing links(wikilinks and backlinks). Used by gdoc export pod to avoid parsing wikilinks as href.
   */
  convertLinks?: boolean;
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
      },
    }) as JSONSchemaType<HTMLPublishPodConfig>;
  }

  async plant(opts: PublishPodPlantOpts): Promise<any> {
    const { config, engine, note } = opts;
    const { fname, convertLinks = true } = config;
    const { data: econfig } = await engine.getConfig();
    const proc = MDUtilsV4.procFull({
      engine,
      dest: DendronASTDest.HTML,
      vault: note.vault,
      fname,
      shouldApplyPublishRules: false,
      publishOpts: {
        insertTitle: ConfigUtils.getProp(econfig!, "useFMTitle"),
      },
      config: econfig!,
      mermaid: ConfigUtils.getProp(econfig!, "mermaid"),
      wikiLinksOpts: { convertLinks },
    });
    const { contents } = await MDUtilsV4.procRehype({
      proc,
      mathjax: true,
    }).process(note!.body);
    return contents as string;
  }
}
