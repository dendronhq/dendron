import { DNodeUtils, SchemaUtils } from "@dendronhq/common-all";
import { getDurationMilliseconds } from "@dendronhq/common-server";
import { ExtensionProvider } from "../../ExtensionProvider";
import { Logger } from "../../logger";
import { CREATE_NEW_SCHEMA_DETAIL } from "./constants";
import { NotePickerUtils, PAGINATE_LIMIT } from "./NotePickerUtils";
import { DendronQuickPickerV2 } from "./types";
import { PickerUtilsV2 } from "./utils";

export class SchemaPickerUtils {
  static async fetchPickerResultsWithCurrentValue({
    picker,
  }: {
    picker: DendronQuickPickerV2;
  }) {
    const { engine, wsRoot, vaults } = ExtensionProvider.getDWorkspace();
    const resp = await engine.querySchema(picker.value);
    const node = SchemaUtils.getModuleRoot(resp.data[0]);
    const perfectMatch = node.fname === picker.value;
    return !perfectMatch
      ? [
          NotePickerUtils.createNoActiveItem({
            fname: picker.value,
            detail: CREATE_NEW_SCHEMA_DETAIL,
          }),
        ]
      : [
          DNodeUtils.enhancePropForQuickInputV3({
            wsRoot,
            props: node,
            schemas: engine.schemas,
            vaults,
          }),
        ];
  }

  static async fetchPickerResults(opts: {
    picker: DendronQuickPickerV2;
    qs: string;
  }) {
    const ctx = "SchemaPickerUtils:fetchPickerResults";
    const start = process.hrtime();
    const { picker, qs } = opts;
    const { engine, wsRoot, vaults } = ExtensionProvider.getDWorkspace();
    const resp = await engine.querySchema(qs);
    let nodes = resp.data.map((ent) => SchemaUtils.getModuleRoot(ent));

    if (nodes.length > PAGINATE_LIMIT) {
      picker.allResults = nodes;
      picker.offset = PAGINATE_LIMIT;
      picker.moreResults = true;
      nodes = nodes.slice(0, PAGINATE_LIMIT);
    } else {
      PickerUtilsV2.resetPaginationOpts(picker);
    }
    const updatedItems = await Promise.all(
      nodes.map(async (ent) =>
        DNodeUtils.enhancePropForQuickInputV3({
          wsRoot,
          props: ent,
          schemas: engine.schemas,
          vaults,
          alwaysShow: picker.alwaysShowAll,
        })
      )
    );
    const profile = getDurationMilliseconds(start);
    Logger.info({ ctx, msg: "engine.querySchema", profile });
    return updatedItems;
  }
}
