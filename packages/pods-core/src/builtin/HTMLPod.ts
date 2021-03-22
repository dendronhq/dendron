import { DendronASTDest, MDUtilsV4 } from "@dendronhq/engine-server";
import { PublishPodPlantOpts, PublishPod } from "../basev3";

const ID = "dendron.html";

export class HTMLPublishPod extends PublishPod {
  static id: string = ID;
  static description: string = "publish html";

  async plant(opts: PublishPodPlantOpts): Promise<any> {
    const { config, engine, note } = opts;
    const { fname, vault } = config;
    const { data: econfig } = await engine.getConfig();
    const proc = MDUtilsV4.procFull({
      engine,
      dest: DendronASTDest.HTML,
      vault,
      fname,
      shouldApplyPublishRules: false,
      publishOpts: {
        insertTitle: econfig!.useFMTitle!,
      },
      config: econfig!,
      mermaid: econfig!.mermaid,
    });
    const { contents } = await MDUtilsV4.procRehype({
      proc,
      mathjax: true,
    }).process(note!.body);
    return contents as string;
  }
}
