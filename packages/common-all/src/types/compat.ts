/** Mimicks VSCode's disposable for cross-compatibility. */
export type Disposable = {
  dispose: () => any;
};

/** Simplified version of VSCode's `Point` class. */
export type VSPosition = {
  line: number;
  character: number;
};

/** Simplified version of VSCode's `Range` class. */
export type VSRange = {
  start: VSPosition;
  end: VSPosition;
};

/** Mirrors VSCode's `DiagnosticSeverity` */
export enum DiagnosticSeverity {
  Error = 0,
  Warning = 1,
  Information = 2,
  Hint = 3,
}

/** Simplified version of VSCode's `Diagnostic` class. */
export type Diagnostic = {
  range: VSRange;
  message: string;
  severity: DiagnosticSeverity;
  code?: string;
};
