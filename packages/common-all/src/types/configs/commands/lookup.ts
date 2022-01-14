/**
 * Enum definition of possible lookup selection behavior values
 */
export enum LookupSelectionModeEnum {
  extract = "extract",
  link = "link",
  none = "none",
}

export enum LookupSelectVaultModeOnCreateEnum {
  smart = "smart",
  alwaysPrompt = "alwaysPrompt",
}

/**
 * String literal type generated from {@link NoteLookupSelectionBehaviorEnum}
 */
export type LookupSelectionMode = keyof typeof LookupSelectionModeEnum;

export type LookupSelectVaultModeOnCreate =
  keyof typeof LookupSelectVaultModeOnCreateEnum;
/**
 * Namespace for configuring lookup commands
 */
export type LookupConfig = {
  note: NoteLookupConfig;
};

/**
 * Namespace for configuring {@link NoteLookupCommand}
 */
export type NoteLookupConfig = {
  selectionMode: LookupSelectionMode;
  selectVaultModeOnCreate: LookupSelectVaultModeOnCreate;
  confirmVaultOnCreate: boolean;
  leaveTrace: boolean;
  bubbleUpCreateNew: boolean;
  fuzzThreshold: number;
};

/**
 * Generates default {@link LookupConfig}
 * @returns LookupConfig
 */
export function genDefaultLookupConfig(): LookupConfig {
  return {
    note: {
      selectionMode: LookupSelectionModeEnum.extract,
      confirmVaultOnCreate: true,
      selectVaultModeOnCreate: LookupSelectVaultModeOnCreateEnum.smart,
      leaveTrace: false,
      bubbleUpCreateNew: true,
      /**
       * Experimentally set.
       *
       * At the time of testing:
       *
       * At previous threshold of 0.5 string 'dendron' matched
       * 'scratch.2021.06.15.104331.make-sure-seeds-are-initialized-on-startup' with score 0.42.
       * Which is too fuzzy of a match.
       *
       * 'rename' fuzzy matches 'dendron.scratch.2020.11.07.publish-under-original-filenames' with 0.16.
       *
       * For reference
       * 'dendron rename' matches 'dendron.dev.design.commands.rename' with 0.001.
       *
       * Having this score too high gets too unrelated matches which pushes the
       * 'Create New' entry out of the view.
       * --------------------------------------------------------------------------------
       *
       * Note if you are going to be tweaking this value it is highly suggested to add a
       * temporary piece of code To be able to see the all the results that are matched by
       * fuse engine along with their scores, inside {@link FuseEngine.queryNote}
       * */
      fuzzThreshold: 0.2,
    },
  };
}
