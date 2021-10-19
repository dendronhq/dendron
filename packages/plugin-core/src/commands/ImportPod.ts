import {
  getAllImportPods,
  ImportPod,
  podClassEntryToPodItemV4,
  PodClassEntryV4,
  PodItemV4,
  PodUtils,
  PROMPT,
} from "@dendronhq/pods-core";
import { ProgressLocation, Uri, window } from "vscode";
import { DENDRON_COMMANDS, Oauth2Pods } from "../constants";
import { VSCodeUtils } from "../utils";
import {
  getGlobalState,
  launchGoogleOAuthFlow,
  openFileInEditor,
  showDocumentQuickPick,
  showInputBox,
  showPodQuickPickItemsV4,
  updateGlobalState,
} from "../utils/pods";
import { getExtension, getDWorkspace } from "../workspace";
import { BaseCommand } from "./base";
import { ReloadIndexCommand } from "./ReloadIndex";

type CommandOutput = void;

type CommandInput = { podChoice: PodItemV4 };

type CommandOpts = CommandInput & { config: any };

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
    const podsDir = getExtension().podsDir;
    try {
      const maybeConfig = PodUtils.getConfig({ podsDir, podClass });

      // config defined and not just the default placeholder config
      if (
        maybeConfig &&
        (maybeConfig.src !== "TODO" || maybeConfig.vaultName !== "TODO")
      ) {
        return { podChoice, config: maybeConfig };
      }

      if (!maybeConfig) {
        PodUtils.genConfigFile({ podsDir, podClass });
      }

      const configPath = PodUtils.getConfigPath({ podsDir, podClass });
      if (
        Oauth2Pods.includes(podChoice.id) &&
        (maybeConfig.accessToken === undefined ||
          maybeConfig.accessToken === "TODO")
      ) {
        launchGoogleOAuthFlow();
        window.showInformationMessage(
          "Google OAuth is a beta feature. Please contact us at support@dendron.so or on Discord to first gain access. Then, try again and authenticate with Google on your browser to continue."
        );
        await VSCodeUtils.openFileInEditor(Uri.file(configPath));
      } else {
        await VSCodeUtils.openFileInEditor(Uri.file(configPath));
        window.showInformationMessage(
          "Looks like this is your first time running this pod. Please fill out the configuration and then run this command again."
        );
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
    this.L.info({ ctx, opts });
    const wsRoot = getDWorkspace().wsRoot;
    const utilityMethods = {
      getGlobalState,
      updateGlobalState,
      showDocumentQuickPick,
      showInputBox,
      openFileInEditor,
    };
    if (!wsRoot) {
      throw Error("ws root not defined");
    }
    const { engine, vaults } = getDWorkspace();
    const pod = new opts.podChoice.podClass() as ImportPod; // eslint-disable-line new-cap
    const fileWatcher = getExtension().fileWatcher;
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
  }

  addAnalyticsPayload(opts?: CommandOpts) {
    return PodUtils.getAnalyticsPayload(opts);
  }
}
