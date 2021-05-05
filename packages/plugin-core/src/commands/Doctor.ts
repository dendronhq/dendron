import {
  DEngineClient,
  NoteUtils,
  NoteProps,
  DLink,
} from "@dendronhq/common-all";
import {
  BackfillV2Command,
  DoctorActions,
  DoctorCLICommand,
} from "@dendronhq/dendron-cli";
import fs from "fs-extra";
import _ from "lodash";
import _md from "markdown-it";
import path from "path";
import { window, ViewColumn } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { VSCodeUtils } from "../utils";
import { DendronWorkspace, getWS } from "../workspace";
import { BasicCommand } from "./base";
import { ReloadIndexCommand } from "./ReloadIndex";

const md = _md();

type Finding = {
  issue: string;
  fix?: string;
};
type CommandOpts = {
  action: DoctorActions;
};

type CommandOutput = {
  data: Finding[];
};

export class DoctorCommand extends BasicCommand<CommandOpts, CommandOutput> {
  static key = DENDRON_COMMANDS.DOCTOR.key;

  async gatherInputs(): Promise<CommandOpts | undefined> {
    const values = _.map(DoctorActions, (ent) => {
      return { label: ent };
    });
    const doctorAction = await VSCodeUtils.showQuickPick(values);
    if (doctorAction?.label) {
      return { action: doctorAction.label };
    }
    return;
  }

  async showPreview(candidates: NoteProps[]) {
    const vault = candidates[0].vault.fsPath;
    let content = [
      "# Create Missing Linked Notes Preview",
      "",
      `## The following files will be created in \'${vault}\'`,
    ];

    _.forEach(candidates, (candidate) => {
      content = content.concat(`- ${candidate.fname}\n`);
    });

    const panel = window.createWebviewPanel(
      "doctorCreateMissingLinkedNotesPreview",
      "Create MissingLinked Notes Preview",
      ViewColumn.One,
      {}
    );
    panel.webview.html = md.render(content.join("\n"));
  }

  async execute(opts: CommandOpts) {
    const ctx = "DoctorCommand:execute";
    window.showInformationMessage("Calling the doctor.");
    const {} = _.defaults(opts, {});
    const ws = DendronWorkspace.instance();
    const wsRoot = DendronWorkspace.wsRoot();
    const findings: Finding[] = [];
    if (_.isUndefined(wsRoot)) {
      throw Error("rootDir undefined");
    }
    const config = ws?.config;
    if (_.isUndefined(config)) {
      throw Error("no config found");
    }

    const siteRoot = path.join(wsRoot, config.site.siteRootDir);
    ws.vaultWatcher!.pause = true;
    this.L.info({ ctx, msg: "pre:Reload" });
    const engine: DEngineClient =
      (await new ReloadIndexCommand().execute()) as DEngineClient;

    switch (opts.action) {
      case DoctorActions.FIX_FRONTMATTER: {
        await new BackfillV2Command().execute({
          engine: engine,
        });
        break;
      }
      case DoctorActions.CREATE_MISSING_LINKED_NOTES: {
        const notes = engine.notes;
        // pick out wild wikilinks
        let wildWikiLinks = [] as DLink[];
        _.forEach(notes, (note) => {
          const links = note.links;
          if (_.isEmpty(links)) {
            return false;
          }
          const wsRoot = DendronWorkspace.wsRoot();
          wildWikiLinks = wildWikiLinks.concat(
            _.filter(links, (link) => {
              if (link.type != "wiki") {
                return false;
              }
              const noteExists = NoteUtils.getNoteByFnameV5({
                fname: link.to!.fname as string,
                vault: note.vault,
                notes: notes,
                wsRoot: wsRoot,
              }) as NoteProps;
              return !noteExists;
            })
          );
          return true;
        });

        // pick out unique candidate notes to create
        const uniqueCandidates = _.map(
          _.uniqBy(wildWikiLinks, "to.fname"),
          (link) => {
            return {
              fname: link.to!.fname,
              vault: link.from.vault,
            };
          }
        ) as NoteProps[];
        if (uniqueCandidates.length > 0) {
          // show preview before creating
          await this.showPreview(uniqueCandidates);
          const options = ["proceed", "cancel"];
          const shouldProceed = await VSCodeUtils.showQuickPick(options, {
            placeHolder: "proceed",
            ignoreFocusOut: true,
          });
          if (shouldProceed !== "proceed") {
            window.showInformationMessage("cancelled");
            break;
          }
          window.showInformationMessage("creating missing links...");
          if (ws.vaultWatcher) {
            ws.vaultWatcher.pause = true;
          }
          _.forEach(uniqueCandidates, async ({ fname, vault }) => {
            await engine.getNoteByPath({
              npath: fname,
              createIfNew: true,
              vault: vault,
            });
          });
        } else {
          window.showInformationMessage(`There are no missing links!`);
        }
        break;
      }
      default: {
        const cmd = new DoctorCLICommand();
        await cmd.execute({
          action: opts.action,
          engine,
          wsRoot,
          server: {},
          exit: false,
        });
      }
    }

    getWS().vaultWatcher!.pause = false;
    await new ReloadIndexCommand().execute();

    // create site root, used for publication
    if (!fs.existsSync(siteRoot)) {
      const f: Finding = { issue: "no siteRoot found" };
      const dendronJekyll = VSCodeUtils.joinPath(
        ws.extensionAssetsDir,
        "jekyll"
      );
      fs.copySync(dendronJekyll.fsPath, siteRoot);
      f.fix = `created siteRoot at ${siteRoot}`;
      findings.push(f);
    }
    return { data: findings };
  }
  async showResponse(findings: CommandOutput) {
    findings.data.forEach((f) => {
      window.showInformationMessage(`issue: ${f.issue}. fix: ${f.fix}`);
    });
    window.showInformationMessage(`Doctor finished checkup 🍭`);
  }
}
