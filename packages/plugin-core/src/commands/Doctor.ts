import {
  DendronError,
  DEngineClient,
  DVault,
  ExtensionEvents,
  isNotUndefined,
  KeybindingConflictDetectedSource,
  NoteProps,
  NoteUtils,
  Position,
  VaultUtils,
} from "@dendronhq/common-all";
import {
  DoctorService,
  DoctorActionsEnum,
  BackfillService,
  RemarkUtils,
} from "@dendronhq/engine-server";
import _ from "lodash";
import _md from "markdown-it";
import fs from "fs-extra";
import { QuickPick, QuickPickItem, Uri, ViewColumn, window } from "vscode";
import {
  ChangeScopeBtn,
  DoctorBtn,
  IDoctorQuickInputButton,
} from "../components/doctor/buttons";
import { DoctorScopeType } from "../components/doctor/types";
import {
  INCOMPATIBLE_EXTENSIONS,
  DENDRON_COMMANDS,
  KNOWN_KEYBINDING_CONFLICTS,
} from "../constants";
import { delayedUpdateDecorations } from "../features/windowDecorations";
import { VSCodeUtils } from "../vsCodeUtils";
import { BasicCommand } from "./base";
import { ReloadIndexCommand } from "./ReloadIndex";
import { AnalyticsUtils } from "../utils/analytics";
import { IDendronExtension } from "../dendronExtensionInterface";
import { KeybindingUtils } from "../KeybindingUtils";
import { QuickPickHierarchySelector } from "../components/lookup/HierarchySelector";
import { PodUIControls } from "../components/pods/PodControls";

const md = _md();
type Finding = {
  issue: string;
  fix?: string;
};

type IncompatibleExtensionInstallStatus = {
  id: string;
  installed: boolean;
};

type CommandOptsData = {
  installStatus?: IncompatibleExtensionInstallStatus[];
};

type CommandOpts = {
  action: DoctorActionsEnum | PluginDoctorActionsEnum;
  scope: DoctorScopeType;
  data?: CommandOptsData;
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

export enum PluginDoctorActionsEnum {
  FIND_INCOMPATIBLE_EXTENSIONS = "findIncompatibleExtensions",
  FIX_KEYBINDING_CONFLICTS = "fixKeybindingConflicts",
}

export class DoctorCommand extends BasicCommand<CommandOpts, CommandOutput> {
  key = DENDRON_COMMANDS.DOCTOR.key;
  private extension: IDendronExtension;

  constructor(ext: IDendronExtension) {
    super();
    this.extension = ext;
  }

  getHierarchy() {
    return new QuickPickHierarchySelector().getHierarchy();
  }

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
      const doctorActionQuickPickItems = _.map(DoctorActionsEnum, (ent) => {
        return { label: ent };
      }) as QuickPickItem[];
      const pluginDoctorActionQuickPickItems = _.map(
        PluginDoctorActionsEnum,
        (ent) => {
          return { label: ent };
        }
      ) as QuickPickItem[];
      const allDoctorActionQuickPickItems = doctorActionQuickPickItems.concat(
        pluginDoctorActionQuickPickItems
      );

      const changeScopeButton = ChangeScopeBtn.create(false);
      const quickPick = this.createQuickPick({
        title: "Doctor",
        placeholder: "Select a Doctor Action.",
        items: allDoctorActionQuickPickItems,
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
          action: doctorAction as DoctorActionsEnum | PluginDoctorActionsEnum,
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
    }[],
    engine: DEngineClient
  ) {
    let content = [
      "# Broken Links Preview",
      "",
      `## The following files have broken links`,
    ];

    const { notes, vaults, wsRoot } = engine;
    _.forEach(_.sortBy(brokenLinks, ["file"]), (ent) => {
      content = content.concat(`${ent.file}\n`);
      const vault = VaultUtils.getVaultByName({
        vaults,
        vname: ent.vault,
      }) as DVault;
      const note = NoteUtils.getNoteByFnameV5({
        fname: ent.file,
        notes,
        vault,
        wsRoot,
      }) as NoteProps;
      const fsPath = NoteUtils.getFullPath({
        note,
        wsRoot,
      });
      const fileContent = fs.readFileSync(fsPath).toString();
      const nodePosition = RemarkUtils.getNodePositionPastFrontmatter(
        fileContent
      ) as Position;
      ent.links.forEach((link) => {
        content = content.concat(
          `- ${link.value} at line ${
            link.line + nodePosition.end.line
          } column ${link.column}\n`
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

  async showIncompatibleExtensionPreview(opts: {
    installStatus: IncompatibleExtensionInstallStatus[];
  }) {
    const { installStatus } = opts;
    const contents = [
      "# Extensions that are incompatible with Dendron.",
      "",
      "The extensions listed below are known to be incompatible with Dendron.",
      "",
      "Neither Dendron nor the extension may function properly when installed concurrently.",
      "",
      "Consider disabling the incompatible extensions when in a Dendron Workspace.",
      "  - [How to disable extensions for a specific workspace without uninstalling](https://code.visualstudio.com/docs/editor/extension-marketplace#_disable-an-extension)",
      "",
      "See [Incompatible Extensions](https://wiki.dendron.so/notes/9Id5LUZFfM1m9djl6KgpP) for more details.",
      "",
      "## Incompatible Extensions: ",
      "",
      "||||",
      "|-|-|-|",
      installStatus
        .map((status) => {
          const commandArgs = `"@id:${status.id}"`;
          const commandUri = Uri.parse(
            `command:workbench.extensions.search?${JSON.stringify(commandArgs)}`
          );
          const message = status.installed
            ? `[View Extension](${commandUri})`
            : "Not Installed";
          return `| ${status.id} | | ${message} | `;
        })
        .join("\n"),
      "",
    ].join("\n");

    const panel = window.createWebviewPanel(
      "incompatibleExtensionsPreview",
      "Incompatible Extensions",
      ViewColumn.One,
      {
        enableCommandUris: true,
      }
    );
    panel.webview.html = md.render(contents);
    AnalyticsUtils.track(
      ExtensionEvents.IncompatibleExtensionsPreviewDisplayed
    );
    return { installStatus, contents };
  }

  private async reload() {
    const engine = await new ReloadIndexCommand().execute();
    if (_.isUndefined(engine)) {
      throw new DendronError({ message: "no engine found." });
    }
    return engine;
  }

  addAnalyticsPayload(opts: CommandOpts) {
    return {
      action: opts.action,
      scope: opts.scope,
    };
  }

  async execute(opts: CommandOpts) {
    const ctx = "DoctorCommand:execute";
    window.showInformationMessage("Calling the doctor.");
    const { wsRoot, config } = this.extension.getDWorkspace();
    const findings: Finding[] = [];
    if (_.isUndefined(wsRoot)) {
      throw new DendronError({ message: "rootDir undefined" });
    }
    if (_.isUndefined(config)) {
      throw new DendronError({ message: "no config found" });
    }

    if (this.extension.fileWatcher) {
      this.extension.fileWatcher.pause = true;
    }
    // Make sure to save any changes in the file because Doctor reads them from
    // disk, and won't see changes that haven't been saved.
    const document = VSCodeUtils.getActiveTextEditor()?.document;
    if (
      isNotUndefined(document) &&
      isNotUndefined(this.extension.wsUtils.getNoteFromDocument(document))
    ) {
      await document.save();
    }
    this.L.info({ ctx, msg: "pre:Reload" });

    if (opts.action !== PluginDoctorActionsEnum.FIND_INCOMPATIBLE_EXTENSIONS) {
      await this.reload();
    }

    let note;
    if (opts.scope === "file") {
      const document = VSCodeUtils.getActiveTextEditor()?.document;
      if (_.isUndefined(document)) {
        throw new DendronError({ message: "No note open." });
      }
      note = this.extension.wsUtils.getNoteFromDocument(document);
    }

    const engine = this.extension.getEngine();

    switch (opts.action) {
      case PluginDoctorActionsEnum.FIND_INCOMPATIBLE_EXTENSIONS: {
        const installStatus =
          opts.data?.installStatus ||
          INCOMPATIBLE_EXTENSIONS.map((ext) => {
            return {
              id: ext,
              installed: VSCodeUtils.isExtensionInstalled(ext),
            };
          });
        await this.showIncompatibleExtensionPreview({ installStatus });
        break;
      }
      case PluginDoctorActionsEnum.FIX_KEYBINDING_CONFLICTS: {
        const conflicts = KeybindingUtils.getConflictingKeybindings({
          knownConflicts: KNOWN_KEYBINDING_CONFLICTS,
        });
        if (conflicts.length > 0) {
          await KeybindingUtils.showKeybindingConflictPreview({ conflicts });
          AnalyticsUtils.track(ExtensionEvents.KeybindingConflictDetected, {
            source: KeybindingConflictDetectedSource.doctor,
          });
        } else {
          window.showInformationMessage(`There are no keybinding conflicts!`);
        }
        break;
      }
      case DoctorActionsEnum.FIX_FRONTMATTER: {
        await new BackfillService().updateNotes({
          engine,
          note,
          // fix notes with broken ids if necessary
          overwriteFields: ["id"],
        });
        break;
      }
      case DoctorActionsEnum.CREATE_MISSING_LINKED_NOTES: {
        let notes;
        if (_.isUndefined(note)) {
          notes = _.values(engine.notes);
          notes = notes.filter((note) => !note.stub);
        } else {
          notes = [note];
        }
        const ds = new DoctorService();
        const uniqueCandidates = ds.getBrokenLinkDestinations(notes, engine);
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
          if (this.extension.fileWatcher) {
            this.extension.fileWatcher.pause = true;
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
        ds.dispose();
        if (this.extension.fileWatcher) {
          this.extension.fileWatcher.pause = false;
        }
        break;
      }
      case DoctorActionsEnum.FIND_BROKEN_LINKS: {
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
        ds.dispose();
        if (out.resp.length === 0) {
          window.showInformationMessage(`There are no broken links!`);
          break;
        }
        await this.showBrokenLinkPreview(out.resp, engine);
        break;
      }
      case DoctorActionsEnum.FIX_AIRTABLE_METADATA: {
        const selection = await this.getHierarchy();
        if (!selection) break;
        const { hierarchy, vault } = selection;
        const podId = await PodUIControls.promptToSelectCustomPodId();
        if (!podId) break;
        const notes = engine.notes;
        const candidates = Object.values(notes).filter(
          (value) =>
            value.fname.startsWith(hierarchy) &&
            value.stub !== true &&
            VaultUtils.isEqualV2(value.vault, vault) &&
            value.custom.airtableId
        );
        this.L.info({
          ctx,
          msg: `${DoctorActionsEnum.FIX_FRONTMATTER} candidates: ${candidates.length}`,
        });
        const ds = new DoctorService();
        await ds.executeDoctorActions({
          action: opts.action,
          candidates,
          engine,
          podId,
        });
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
        ds.dispose();
      }
    }

    if (this.extension.fileWatcher) {
      this.extension.fileWatcher.pause = false;
    }

    if (opts.action !== PluginDoctorActionsEnum.FIND_INCOMPATIBLE_EXTENSIONS) {
      await this.reload();
      // Decorations don't auto-update here, I think because the contents of the
      // note haven't updated within VSCode yet. Regenerate the decorations, but
      // do so after a delay so that VSCode can update the file contents. Not a
      // perfect solution, but the simplest.
      delayedUpdateDecorations();
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
