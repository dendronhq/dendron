import { createLogger } from "@dendronhq/common-server";
import { BaseCommand } from "./base";
import { QuickPickItem, QuickInput, QuickInputButton, Disposable, window, QuickInputButtons, Uri } from "vscode";
import fs from 'fs-extra';
import { resolvePath } from "../utils";
import { DendronEngine, FilePod } from "@dendronhq/engine-server";

const L = createLogger("ImportPodCommand");

type ImportPodCommandOpts = {
    wsRoot: string
};

interface State {
    title: string;
    step: number;
    totalSteps: number;
    podType: QuickPickItem | string;
    name: string;
    podSrc: string;
}

interface InputBoxParameters {
	title: string;
	step: number;
	totalSteps: number;
	value: string;
	prompt: string;
	validate: (value: string) => Promise<string | undefined>;
	buttons?: QuickInputButton[];
	shouldResume: () => Thenable<boolean>;
}

type InputStep = (input: MultiStepInput) => Thenable<InputStep | void>;
class InputFlowAction {
	static back = new InputFlowAction();
	static cancel = new InputFlowAction();
	static resume = new InputFlowAction();
}

interface QuickPickParameters<T extends QuickPickItem> {
	title: string;
	step: number;
	totalSteps: number;
	items: T[];
	activeItem?: T;
	placeholder: string;
	buttons?: QuickInputButton[];
	shouldResume: () => Thenable<boolean>;
}


const title = 'Choose a pod';
const pods: QuickPickItem[] = ['LocalFiles Pod', 'TBD']
.map(label => ({ label }));

class MultiStepInput {
    private current?: QuickInput;
    private steps: InputStep[] = [];

    static async run<T>(start: InputStep) {
		const input = new MultiStepInput();
		return input.stepThrough(start);
    }

	private async stepThrough<T>(start: InputStep) {
		let step: InputStep | void = start;
		while (step) {
			this.steps.push(step);
			if (this.current) {
				this.current.enabled = false;
				this.current.busy = true;
			}
			try {
				step = await step(this);
			} catch (err) {
				if (err === InputFlowAction.back) {
					this.steps.pop();
					step = this.steps.pop();
				} else if (err === InputFlowAction.resume) {
					step = this.steps.pop();
				} else if (err === InputFlowAction.cancel) {
					step = undefined;
				} else {
					throw err;
				}
			}
		}
		if (this.current) {
			this.current.dispose();
		}
    }

    async showInputBox<P extends InputBoxParameters>({ title, step, totalSteps, value, prompt, validate, buttons, shouldResume }: P) {
		const disposables: Disposable[] = [];
		try {
			return await new Promise<string | (P extends { buttons: (infer I)[] } ? I : never)>((resolve, reject) => {
				const input = window.createInputBox();
				input.title = title;
				input.step = step;
				input.totalSteps = totalSteps;
				input.value = value || '';
				input.prompt = prompt;
				input.buttons = [
					...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
					...(buttons || [])
				];
				let validating = validate('');
				disposables.push(
					input.onDidTriggerButton(item => {
						if (item === QuickInputButtons.Back) {
							reject(InputFlowAction.back);
						} else {
							resolve(<any>item);
						}
					}),
					input.onDidAccept(async () => {
						const value = input.value;
						input.enabled = false;
						input.busy = true;
						if (!(await validate(value))) {
							resolve(value);
						}
						input.enabled = true;
						input.busy = false;
					}),
					input.onDidChangeValue(async text => {
						const current = validate(text);
						validating = current;
						const validationMessage = await current;
						if (current === validating) {
							input.validationMessage = validationMessage;
						}
					}),
					input.onDidHide(() => {
						(async () => {
							reject(shouldResume && await shouldResume() ? InputFlowAction.resume : InputFlowAction.cancel);
						})()
							.catch(reject);
					})
				);
				if (this.current) {
					this.current.dispose();
				}
				this.current = input;
				this.current.show();
			});
		} finally {
			disposables.forEach(d => d.dispose());
		}
	}

	async showQuickPick<T extends QuickPickItem, P extends QuickPickParameters<T>>({ title, step, totalSteps, items, activeItem, placeholder, buttons, shouldResume }: P) {
		const disposables: Disposable[] = [];
		try {
			return await new Promise<T | (P extends { buttons: (infer I)[] } ? I : never)>((resolve, reject) => {
				const input = window.createQuickPick<T>();
				input.title = title;
				input.step = step;
				input.totalSteps = totalSteps;
				input.placeholder = placeholder;
				input.items = items;
				if (activeItem) {
					input.activeItems = [activeItem];
				}
				input.buttons = [
					...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
					...(buttons || [])
				];
				disposables.push(
					input.onDidTriggerButton(item => {
						if (item === QuickInputButtons.Back) {
							reject(InputFlowAction.back);
						} else {
							resolve(<any>item);
						}
					}),
					input.onDidChangeSelection(items => resolve(items[0])),
					input.onDidHide(() => {
						(async () => {
							reject(shouldResume && await shouldResume() ? InputFlowAction.resume : InputFlowAction.cancel);
						})()
							.catch(reject);
					})
				);
				if (this.current) {
					this.current.dispose();
				}
				this.current = input;
				this.current.show();
			});
		} finally {
			disposables.forEach(d => d.dispose());
		}
	}
}



async function multiStepInput(opts: ImportPodCommandOpts) {

    const totalSteps = 2;

    async function collectInputs() {
		const state = {} as Partial<State>;
		await MultiStepInput.run(input => pickResourceGroup(input, state));
		return state as State;
    }
    
    async function pickResourceGroup(input: MultiStepInput, state: Partial<State>) {
		const pick = await input.showQuickPick({
			title,
			step: 1,
			totalSteps,
			placeholder: 'Pick a resource group',
			items: pods,
			activeItem: typeof state.podType !== 'string' ? state.podType : undefined,
			shouldResume: shouldResume
		});
		state.podType = pick;
		return (input: MultiStepInput) => inputName(input, state);
    }

    async function inputName(input: MultiStepInput, state: Partial<State>) {
		const additionalSteps = typeof state.podType === 'string' ? 1 : 0;
		state.podSrc = await input.showInputBox({
			title,
			step: 2 + additionalSteps,
			totalSteps: totalSteps + additionalSteps,
			value: state.name || '',
            prompt: 'Path to current workspace',
            validate:  async (podPath: string) => { 
                const cleanPodPath: string = resolvePath(podPath, opts.wsRoot);
                if (!fs.existsSync(cleanPodPath)) {
                    return `podPath ${podPath} does not exist`
                }
                return undefined; 
            },
			shouldResume: shouldResume
		});
    }

    async function shouldResume() {
        // Could show a notification with the option to resume.
        return true
    }

    const state = await collectInputs();
    // const state = {podSrc: "/Users/kevinlin/projects/dendronv2/dendron/packages/engine-server/fixtures/pods/filePod"};
    const engine = DendronEngine.getOrCreateEngine();
    const uri = Uri.parse(state.podSrc);
    const fp = new FilePod({engine, root: uri});
    return await fp.import();
}

export class ImportPodCommand extends BaseCommand<ImportPodCommandOpts> {

    async execute(opts: ImportPodCommandOpts) {
        const ctx = "execute";
        L.info({ ctx, opts });
        await multiStepInput(opts);
    }
}