import { DendronASTDest, MDUtilsV4 } from "@dendronhq/engine-server";
import * as vscode from "vscode";
import { PickerUtilsV2 } from "./components/lookup/utils";
import { Logger } from "./logger";
import { DendronWorkspace, getWS } from "./workspace";
import { DWorkspace } from "./workspacev2";

export function activate(context: vscode.ExtensionContext) {
  Logger.configure(context, "debug");
  require("./_extension").activate(context);
  return {
    DWorkspace,
    Logger,
    extendMarkdownIt(md: any) {
      return md.use((_md: any) => {
        _md.core.ruler.before("block", "dendron", (state: any) => {
          try {
            const engine = DendronWorkspace.instance().getEngine();
            const config = getWS().config;
            const { useFMTitle } = config;
            const prettyRefs = config.site.usePrettyRefs;
            const vault = PickerUtilsV2.getOrPromptVaultForOpenEditor();
            const fname = PickerUtilsV2.getFnameForOpenEditor();
            state.src = MDUtilsV4.procFull({
              engine,
              wikiLinksOpts: { useId: true },
              dest: DendronASTDest.MD_REGULAR,
              publishOpts: { insertTitle: useFMTitle, prettyRefs },
              vault,
              fname,
              mathOpts: { katex: true },
              config: config.site,
            }).processSync(state.src).contents;
          } catch (err) {
            // vscode.window.showInformationMessage(
            //   "Dendron is still loading. Not all Dendron preview features are available at this time. Please close and re-open the preview after Dendron has activated to have all features"
            // );
            return;
            // state.src = "Waiting for engine to load...";
          }
        });
        return _md;
      });
    },
  };
}

export function deactivate() {
  require("./_extension").deactivate();
}
