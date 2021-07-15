import { DEngineClient, NoteProps } from "@dendronhq/common-all";
import {
  BackfillV2Command,
  DoctorActions,
  DoctorCLICommand,
} from "@dendronhq/dendron-cli";
import fs from "fs-extra";
import _ from "lodash";
import _md from "markdown-it";
import path from "path";
import { QuickPick, ViewColumn, window } from "vscode";
import {
  ChangeScopeBtn,
  DoctorBtn,
  IDoctorQuickInputButton,
} from "../components/doctor/buttons";
import { DoctorScopeType } from "../components/doctor/types";
import { DENDRON_COMMANDS } from "../constants";
import { VSCodeUtils } from "../utils";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";
import { ReloadIndexCommand } from "./ReloadIndex";

const md = _md();

type Finding = {
  issue: string;
  fix?: string;
};

type CommandOpts = {
  action: DoctorActions;
  scope: DoctorScopeType;
};

type CommandOutput = {
  data: Finding[];
};

type CreateQuickPickOpts = {
  title: string;
  placeholder: string;
  items: DoctorQuickInput[];
  /**
   * QuickPick.ignoreFocusOut prop
   */
  ignoreFocusOut?: boolean;
  nonInteractive?: boolean;
  buttons?: DoctorBtn[];
};

type DoctorQuickInput = {
  label: string;
  detail?: string;
  alwaysShow?: boolean;
};

type DoctorQuickPickItem = QuickPick<DoctorQuickInput>;

export class DoctorCommand extends BasicCommand<CommandOpts, CommandOutput> {
  key = DENDRON_COMMANDS.DOCTOR.key;

  createQuickPick(opts: CreateQuickPickOpts) {
    const { title, placeholder, ignoreFocusOut, items } = _.defaults(opts, {
      ignoreFocusOut: true,
    });
    const quickPick =
      VSCodeUtils.createQuickPick<DoctorQuickInput>() as DoctorQuickPickItem;
    quickPick.title = title;
    quickPick.placeholder = placeholder;
    quickPick.ignoreFocusOut = ignoreFocusOut;
    quickPick.items = items;
    quickPick.buttons = opts.buttons!;

    return quickPick;
  }

  onTriggerButton = async (quickpick: DoctorQuickPickItem) => {
    if (!quickpick) {
      return;
    }
    const button = quickpick.buttons[0] as IDoctorQuickInputButton;
    button.pressed = !button.pressed;
    button.type = button.type === "workspace" ? "file" : "workspace";
    quickpick.buttons = [button];
    quickpick.title = `Doctor (${button.type})`;
  };

  async gatherInputs(): Promise<CommandOpts | undefined> {
    // eslint-disable-next-line no-async-promise-executor
    const out = new Promise<CommandOpts | undefined>(async (resolve) => {
      const values = _.map(DoctorActions, (ent) => {
        return { label: ent };
      });
      const changeScopeButton = ChangeScopeBtn.create(false);
      const quickPick = this.createQuickPick({
        title: "Doctor",
        placeholder: "Select a Doctor Action.",
        items: values,
        buttons: [changeScopeButton],
      });
      const scope = (quickPick.buttons[0] as IDoctorQuickInputButton).type;
      quickPick.title = `Doctor (${scope})`;
      quickPick.onDidAccept(async () => {
        quickPick.hide();
        const doctorAction = quickPick.selectedItems[0].label;
        const doctorScope = (quickPick.buttons[0] as IDoctorQuickInputButton)
          .type;
        return resolve({
          action: doctorAction as DoctorActions,
          scope: doctorScope,
        });
      });
      quickPick.onDidTriggerButton(() => this.onTriggerButton(quickPick));
      quickPick.show();
    });
    return out;
  }

  async showMissingNotePreview(candidates: NoteProps[]) {
    let content = [
      "# Create Missing Linked Notes Preview",
      "",
      `## The following files will be created`,
    ];
    console.log("it's here");
    _.forEach(_.sortBy(candidates, ["vault.fsPath"]), (candidate) => {
      content = content.concat(
        `- ${candidate.vault.fsPath}/${candidate.fname}\n`
      );
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
    if (ws.fileWatcher) {
      ws.fileWatcher.pause = true;
    }
    this.L.info({ ctx, msg: "pre:Reload" });
    const engine: DEngineClient =
      (await new ReloadIndexCommand().execute()) as DEngineClient;

    let note;
    if (opts.scope === "file") {
      const document = VSCodeUtils.getActiveTextEditor()?.document;
      if (_.isUndefined(document)) {
        throw Error("No note open");
      }
      note = VSCodeUtils.getNoteFromDocument(document);
    }

    switch (opts.action) {
      case DoctorActions.FIX_FRONTMATTER: {
        await new BackfillV2Command().execute({
          engine,
          note,
          // fix notes with broken ids if necessary
          overwriteFields: ["id"],
        });
        break;
      }
      case DoctorActions.CREATE_MISSING_LINKED_NOTES: {
        // if (opts.scope === "workspace") {
        //   window.showInformationMessage(
        //     "This action is currently not supported in workspace scope."
        //   );
        //   break;
        // }
        const cmd = new DoctorCLICommand();
        let notes;
        if (_.isUndefined(note)) {
          notes = _.values(engine.notes);
          notes = notes.filter((note) => !note.stub);
        } else {
          notes = [note];
        }
        const uniqueCandidates = cmd.getWildLinkDestinations(notes, engine);
        if (uniqueCandidates.length > 0) {
          // show preview before creating
          await this.showMissingNotePreview(uniqueCandidates);
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
          if (ws.fileWatcher) {
            ws.fileWatcher.pause = true;
          }
          await cmd.execute({
            action: opts.action,
            candidates: notes,
            engine,
            wsRoot,
            server: {},
            exit: false,
          });
        } else {
          window.showInformationMessage(`There are no missing links!`);
        }
        if (ws.fileWatcher) {
          ws.fileWatcher.pause = false;
        }
        break;
      }
      default: {
        const cmd = new DoctorCLICommand();
        const candidates: NoteProps[] | undefined = _.isUndefined(note)
          ? undefined
          : [note];
        await cmd.execute({
          action: opts.action,
          candidates,
          engine,
          wsRoot,
          server: {},
          exit: false,
        });
      }
    }

    if (ws.fileWatcher) {
      ws.fileWatcher.pause = false;
    }
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
