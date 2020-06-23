export class ResolvedKeybindingPart {
  readonly ctrlKey: boolean;
  readonly shiftKey: boolean;
  readonly altKey: boolean;
  readonly metaKey: boolean;

  readonly keyLabel: string | null;
  readonly keyAriaLabel: string | null;

  constructor(
    ctrlKey: boolean,
    shiftKey: boolean,
    altKey: boolean,
    metaKey: boolean,
    kbLabel: string | null,
    kbAriaLabel: string | null
  ) {
    this.ctrlKey = ctrlKey;
    this.shiftKey = shiftKey;
    this.altKey = altKey;
    this.metaKey = metaKey;
    this.keyLabel = kbLabel;
    this.keyAriaLabel = kbAriaLabel;
  }
}

/**
 * A resolved keybinding. Can be a simple keybinding or a chord keybinding.
 */
export abstract class ResolvedKeybinding {
  /**
   * This prints the binding in a format suitable for displaying in the UI.
   */
  public abstract getLabel(): string | null;
  /**
   * This prints the binding in a format suitable for ARIA.
   */
  public abstract getAriaLabel(): string | null;
  /**
   * This prints the binding in a format suitable for electron's accelerators.
   * See https://github.com/electron/electron/blob/master/docs/api/accelerator.md
   */
  public abstract getElectronAccelerator(): string | null;
  /**
   * This prints the binding in a format suitable for user settings.
   */
  public abstract getUserSettingsLabel(): string | null;
  /**
   * Is the user settings label reflecting the label?
   */
  public abstract isWYSIWYG(): boolean;

  /**
   * Is the binding a chord?
   */
  public abstract isChord(): boolean;

  /**
   * Returns the parts that comprise of the keybinding.
   * Simple keybindings return one element.
   */
  public abstract getParts(): ResolvedKeybindingPart[];

  /**
   * Returns the parts that should be used for dispatching.
   */
  public abstract getDispatchParts(): (string | null)[];
}
