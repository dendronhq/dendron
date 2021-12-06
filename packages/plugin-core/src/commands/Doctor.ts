import {
  DEngineClient,
  isNotUndefined,
  NoteProps,
} from "@dendronhq/common-all";
import {
  DoctorService,
  DoctorActions,
  BackfillService,
} from "@dendronhq/engine-server";
import _ from "lodash";
import _md from "markdown-it";
import { QuickPick, ViewColumn, window } from "vscode";
import {
  ChangeScopeBtn,
  DoctorBtn,
  IDoctorQuickInputButton,
} from "../components/doctor/buttons";
import { DoctorScopeType } from "../components/doctor/types";
import { DENDRON_COMMANDS } from "../constants";
import { delayedUpdateDecorations } from "../features/windowDecorations";
import { VSCodeUtils } from "../vsCodeUtils";
import { getDWorkspace, getExtension } from "../workspace";
import { WSUtils } from "../WSUtils";
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

  async gatherInputs(inputs: CommandOpts): Promise<CommandOpts | undefined> {
    // If inputs are already provided, don't ask the user.
    if (inputs && inputs.action && inputs.scope) return inputs;
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

  async showBrokenLinkPreview(
    brokenLinks: {
      file: string;
      vault: string;
      links: {
        value: string;
        line: number;
        column: number;
      }[];
    }[]
  ) {
    let content = [
      "# Broken Links Preview",
      "",
      `## The following files have broken links`,
    ];
    _.forEach(_.sortBy(brokenLinks, ["file"]), (ent) => {
      content = content.concat(`${ent.file}\n`);
      ent.links.forEach((link) => {
        content = content.concat(
          `- ${link.value} at line ${link.line} column ${link.column}\n`
        );
      });
    });

    const panel = window.createWebviewPanel(
      "doctorBrokenLinksPreview",
      "Create Broken Links Preview",
      ViewColumn.One,
      {}
    );
    panel.webview.html = md.render(content.join("\n"));
  }

  async execute(opts: CommandOpts) {
    const ctx = "DoctorCommand:execute";
    window.showInformationMessage("Calling the doctor.");
    const ext = getExtension();
    const { wsRoot, config } = getDWorkspace();
    const findings: Finding[] = [];
    if (_.isUndefined(wsRoot)) {
      throw Error("rootDir undefined");
    }
    if (_.isUndefined(config)) {
      throw Error("no config found");
    }

    if (ext.fileWatcher) {
      ext.fileWatcher.pause = true;
    }
    // Make sure to save any changes in the file because Doctor reads them from
    // disk, and won't see changes that haven't been saved.
    const document = VSCodeUtils.getActiveTextEditor()?.document;
    if (
      isNotUndefined(document) &&
      isNotUndefined(WSUtils.getNoteFromDocument(document))
    ) {
      await document.save();
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
      note = WSUtils.getNoteFromDocument(document);
    }

    switch (opts.action) {
      case DoctorActions.FIX_FRONTMATTER: {
        await new BackfillService().updateNotes({
          engine,
          note,
          // fix notes with broken ids if necessary
          overwriteFields: ["id"],
        });
        break;
      }
      case DoctorActions.CREATE_MISSING_LINKED_NOTES: {
        let notes;
        if (_.isUndefined(note)) {
          notes = _.values(engine.notes);
          notes = notes.filter((note) => !note.stub);
        } else {
          notes = [note];
        }
        const ds = new DoctorService();
        const uniqueCandidates = ds.getWildLinkDestinations(notes, engine);
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
          if (ext.fileWatcher) {
            ext.fileWatcher.pause = true;
          }
          await ds.executeDoctorActions({
            action: opts.action,
            candidates: notes,
            engine,
            exit: false,
          });
        } else {
          window.showInformationMessage(`There are no missing links!`);
        }
        if (ext.fileWatcher) {
          ext.fileWatcher.pause = false;
        }
        break;
      }
      case DoctorActions.FIND_BROKEN_LINKS: {
        let notes;
        if (_.isUndefined(note)) {
          notes = _.values(engine.notes);
          notes = notes.filter((note) => !note.stub);
        } else {
          notes = [note];
        }
        const ds = new DoctorService();
        const out = await ds.executeDoctorActions({
          action: opts.action,
          candidates: notes,
          engine,
          exit: false,
          quiet: true,
        });
        if (out.resp.length === 0) {
          window.showInformationMessage(`There are no broken links!`);
          break;
        }
        await this.showBrokenLinkPreview(out.resp);
        break;
      }
      default: {
        const candidates: NoteProps[] | undefined = _.isUndefined(note)
          ? undefined
          : [note];
        const ds = new DoctorService();
        await ds.executeDoctorActions({
          action: opts.action,
          candidates,
          engine,
          exit: false,
        });
      }
    }

    if (ext.fileWatcher) {
      ext.fileWatcher.pause = false;
    }
    await new ReloadIndexCommand().execute();
    // Decorations don't auto-update here, I think because the contents of the
    // note haven't updated within VSCode yet. Regenerate the decorations, but
    // do so after a delay so that VSCode can update the file contents. Not a
    // perfect solution, but the simplest.
    delayedUpdateDecorations();
    return { data: findings };
  }
  async showResponse(findings: CommandOutput) {
    findings.data.forEach((f) => {
      window.showInformationMessage(`issue: ${f.issue}. fix: ${f.fix}`);
    });
    window.showInformationMessage(`Doctor finished checkup 🍭`);
  }
}
