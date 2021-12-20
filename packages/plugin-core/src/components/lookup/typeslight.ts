/**
 * Types that do not carry heavy dependencies (which is currently includes)
 * Heavy dependencies are currently considered any dependencies that
 * lead to calling getExtension()
 */

export enum VaultSelectionMode {
  /**
   * Never prompt the user. Useful for testing
   */
  auto,

  /**
   * Tries to determine the vault automatically, but will prompt the user if
   * there is ambiguity
   */
  smart,

  /**
   * Always prompt the user if there is more than one vault
   */
  alwaysPrompt,
}
