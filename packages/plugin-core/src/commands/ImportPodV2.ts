import {
  getBuiltInPods,
  Pod,
  PodClass,
  PodOptEntry,
} from "@dendronhq/engine-server";
import _ from "lodash";
import { QuickPickItem, window } from "vscode";
import { BasicCommand } from "./base";
import { DendronWorkspace } from "../workspace";

type CommandOpts = { pod: Pod; podOpts: any };

type CommandInput = CommandOpts;

type CommandOutput = void;

type PodItem = {
  checked: boolean;
  id: string;
  description: string;
  podClass: PodClass;
};

type PodQuickPickItem = QuickPickItem & PodItem;

const showQuickPickItems = (podItem: PodItem[]) => {
  const pickItems: PodQuickPickItem[] = podItem.map((podItem) => {
    return {
      label: podItem.id,
      ...podItem,
    } as PodQuickPickItem;
  });
  return window.showQuickPick(pickItems, {
    placeHolder: "Choose Pods to Import",
    ignoreFocusOut: false,
    matchOnDescription: true,
    canPickMany: false,
  });
};

function mergeOpts(
  resp: any,
  podOpt: PodOptEntry | null,
  collectedOpts: any
): any | undefined {
  if (!resp) {
    return;
  }
  // first entry
  if (_.isNull(podOpt)) {
    return {};
  }
  return _.merge(collectedOpts, { [podOpt.name]: resp });
}

async function handlePodOptEntry(
  acc: any,
  curr: PodOptEntry,
  collectedOpts: any
) {
  const [inputResp, podOpt] = await acc;
  collectedOpts = mergeOpts(inputResp, podOpt, collectedOpts);
  switch (curr.type) {
    case "string": {
      const resp = await window.showInputBox({ prompt: curr.description });
      return [resp, curr];
    }
    default: {
      throw Error(`invalid type: ${curr.type}, item:${curr}`);
    }
  }
}

const handleQuickPickAction = async (item: PodItem) => {
  const PodClass = item.podClass;
  const opts = PodClass.importOpts;
  let out: any = {};

  const [inputResp, podOpt] = await _.reduce<PodOptEntry, any>(
    opts,
    async (acc, curr) => {
      return await handlePodOptEntry(acc, curr, out);
    },
    Promise.resolve([null, null])
  );

  out = mergeOpts(inputResp, podOpt, out);

  return out;
};

export class ImportPodV2Command extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  async gatherInputs(): Promise<CommandInput | undefined> {
    const pods = getBuiltInPods();
    const podItems: PodItem[] = pods.map((p) => {
      return {
        id: p.id,
        checked: false,
        description: p.description,
        podClass: p,
      };
    });
    const podChoice = await showQuickPickItems(podItems);
    if (!podChoice) {
      return;
    }
    const podOpts = await handleQuickPickAction(
      (podChoice as unknown) as PodItem
    );
    const engine = DendronWorkspace.instance().engine;
    const pod = new podChoice.podClass({ engine });
    return { pod, podOpts };
  }

  async execute(opts: CommandOpts) {
    const { pod, podOpts } = opts;
    const { error } = await pod.import(podOpts);
    if (error) {
      window.showErrorMessage(error);
    } else {
      window.showInformationMessage("import successful");
    }
  }
}
