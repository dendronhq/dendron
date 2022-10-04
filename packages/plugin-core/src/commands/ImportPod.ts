import { NoteProps } from "@dendronhq/common-all";
import {
  getAllImportPods,
  ImportPod,
  podClassEntryToPodItemV4,
  PodClassEntryV4,
  PodItemV4,
  PodUtils,
  PROMPT,
} from "@dendronhq/pods-core";
import _ from "lodash";
import { ProgressLocation, Uri, window } from "vscode";
import { DENDRON_COMMANDS, Oauth2Pods } from "../constants";
import { ExtensionProvider } from "../ExtensionProvider";
import {
  getGlobalState,
  launchGoogleOAuthFlow,
  openFileInEditor,
  showDocumentQuickPick,
  showInputBox,
  showPodQuickPickItemsV4,
  updateGlobalState,
  handleConflict,
} from "../utils/pods";
import { VSCodeUtils } from "../vsCodeUtils";
import { BaseCommand } from "./base";
import { ReloadIndexCommand } from "./ReloadIndex";

type CommandOutput = NoteProps[];

export type CommandInput = { podChoice: PodItemV4 };

export type CommandOpts = CommandInput & { config: any };

export class ImportPodCommand extends BaseCommand<
  CommandOpts,
  CommandOutput,
  CommandInput
> {
  public pods: PodClassEntryV4[];
  key = DENDRON_COMMANDS.IMPORT_POD.key;

  constructor(_name?: string) {
    super(_name);
    this.pods = getAllImportPods();
  }

  async gatherInputs() {
    const pods = getAllImportPods();
    const podItems: PodItemV4[] = pods.map((p) => podClassEntryToPodItemV4(p));
    const podChoice = await showPodQuickPickItemsV4(podItems);
    if (!podChoice) {
      return;
    }
    return { podChoice };
  }

  async enrichInputs(inputs: CommandInput): Promise<CommandOpts | undefined> {
    const podChoice = inputs.podChoice;
    const podClass = podChoice.podClass;
    const podsDir = ExtensionProvider.getPodsDir();
    try {
      const resp = PodUtils.getConfig({ podsDir, podClass });
      if (resp.error) {
        PodUtils.genConfigFile({ podsDir, podClass });
      }
      const maybeConfig = resp.data || {};
      // config defined and not just the default placeholder config
      if (
        maybeConfig &&
        !_.isEmpty(maybeConfig) &&
        (maybeConfig.src !== "TODO" || maybeConfig.vaultName !== "TODO")
      ) {
        return { podChoice, config: maybeConfig };
      }

      const configPath = PodUtils.getConfigPath({ podsDir, podClass });
      if (
        Oauth2Pods.includes(podChoice.id) &&
        (maybeConfig.accessToken === undefined ||
          maybeConfig.accessToken === "TODO")
      ) {
        await launchGoogleOAuthFlow();
        window.showInformationMessage(
          "Google OAuth is a beta feature. Please contact us at support@dendron.so or on Discord to first gain access. Then, try again and authenticate with Google on your browser to continue."
        );
        await VSCodeUtils.openFileInEditor(Uri.file(configPath));
      } else {
        await VSCodeUtils.openFileInEditor(Uri.file(configPath));
        window.showInformationMessage(
          "Looks like this is your first time running this pod. Please fill out the configuration and then run this command again."
        );
        return;
      }
      return;
    } catch (e: any) {
      // The user's import configuration has YAML syntax errors:
      if (e.name === "YAMLException")
        window.showErrorMessage(
          "The configuration is invalid YAML. Please fix and run this command again."
        );
      else {
        throw e;
      }
      return;
    }
  }

  async execute(opts: CommandOpts) {
    const ctx = { ctx: "ImportPod" };
    this.L.info({ ctx, msg: "enter", podChoice: opts.podChoice.id });
    const { wsRoot, engine, vaults } = ExtensionProvider.getDWorkspace();
    const utilityMethods = {
      getGlobalState,
      updateGlobalState,
      showDocumentQuickPick,
      showInputBox,
      openFileInEditor,
      handleConflict,
    };
    if (!wsRoot) {
      throw Error("ws root not defined");
    }
    const pod = new opts.podChoice.podClass() as ImportPod; // eslint-disable-line new-cap
    const fileWatcher = ExtensionProvider.getExtension().fileWatcher;
    if (fileWatcher) {
      fileWatcher.pause = true;
    }
    const importedNotes = await window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: "Finding documents...",
        cancellable: false,
      },
      async () => {
        const { importedNotes, errors } = await pod.execute({
          config: opts.config,
          engine,
          wsRoot,
          vaults,
          utilityMethods,
          onPrompt: async (type?: PROMPT) => {
            const resp =
              type === PROMPT.USERPROMPT
                ? await window.showInformationMessage(
                    "Do you want to overwrite",
                    { modal: true },
                    { title: "Yes" }
                  )
                : window.showInformationMessage(
                    "Note is already in sync with the google doc"
                  );
            return resp;
          },
        });

        if (errors && errors.length > 0) {
          let errorMsg = `Error while importing ${errors.length} notes:\n`;
          errors.forEach((e) => {
            errorMsg += e.path + "\n";
          });
          window.showErrorMessage(errorMsg);
        }

        return importedNotes;
      }
    );
    await new ReloadIndexCommand().execute();
    if (fileWatcher) {
      fileWatcher.pause = false;
    }
    window.showInformationMessage(
      `${importedNotes.length} notes imported successfully.`
    );

    return importedNotes;
  }

  addAnalyticsPayload(opts?: CommandOpts, out?: NoteProps[]) {
    return {
      ...PodUtils.getAnalyticsPayload(opts),
      importCount: out?.length,
    };
  }
}
