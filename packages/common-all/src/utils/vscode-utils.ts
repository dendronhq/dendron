/**
 * Code from https://github.com/microsoft/vscode
 */

export interface IProgressStep {
  message?: string;
  increment?: number;
  total?: number;
}

export interface IProgress<T> {
  report(item: T): void;
}

export interface IProgressOptions {
  readonly location: string;
  readonly title?: string;
  readonly source?: string | { label: string; id: string };
  readonly total?: number;
  readonly cancellable?: boolean;
  readonly buttons?: string[];
}
