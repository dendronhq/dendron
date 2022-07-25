import _ from "lodash";
import semver from "semver";
import { Event, version as vscodeVersion, ViewColumn, window } from "vscode";

/**
 * NOTE: type definitions copied over from vscode@1.68 to support vscode version 1.62-1.67
 * will be removed once we bump min version to 1.68
 */
export interface Tab {
  /**
   * The text displayed on the tab.
   */
  readonly label: string;

  /**
   * The group which the tab belongs to.
   */
  readonly group: TabGroup;

  /**
   * Defines the structure of the tab i.e. text, notebook, custom, etc.
   * Resource and other useful properties are defined on the tab kind.
   */
  readonly input: any;

  /**
   * Whether or not the tab is currently active.
   * This is dictated by being the selected tab in the group.
   */
  readonly isActive: boolean;

  /**
   * Whether or not the dirty indicator is present on the tab.
   */
  readonly isDirty: boolean;

  /**
   * Whether or not the tab is pinned (pin icon is present).
   */
  readonly isPinned: boolean;

  /**
   * Whether or not the tab is in preview mode.
   */
  readonly isPreview: boolean;
}

/**
 * NOTE: type definitions copied over from vscode@1.68 to support vscode version 1.62-1.67
 * will be removed once we bump min version to 1.68
 */
export interface TabGroup {
  /**
   * Whether or not the group is currently active.
   *
   * *Note* that only one tab group is active at a time, but that multiple tab
   * groups can have an {@link TabGroup.aciveTab active tab}.
   *
   * @see {@link Tab.isActive}
   */
  readonly isActive: boolean;

  /**
   * The view column of the group.
   */
  readonly viewColumn: ViewColumn;

  /**
   * The active {@link Tab tab} in the group. This is the tab whose contents are currently
   * being rendered.
   *
   * *Note* that there can be one active tab per group but there can only be one {@link TabGroups.activeTabGroup active group}.
   */
  readonly activeTab: Tab | undefined;

  /**
   * The list of tabs contained within the group.
   * This can be empty if the group has no tabs open.
   */
  readonly tabs: readonly Tab[];
}

/**
 * NOTE: type definitions copied over from vscode@1.68 to support vscode version 1.62-1.67
 * will be removed once we bump min version to 1.68
 */
export interface TabGroups {
  /**
   * All the groups within the group container.
   */
  readonly all: readonly TabGroup[];

  /**
   * The currently active group.
   */
  readonly activeTabGroup: TabGroup;

  /**
   * An {@link Event event} which fires when {@link TabGroup tab groups} have changed.
   */
  readonly onDidChangeTabGroups: Event<any>;

  /**
   * An {@link Event event} which fires when {@link Tab tabs} have changed.
   */
  readonly onDidChangeTabs: Event<any>;

  /**
   * Closes the tab. This makes the tab object invalid and the tab
   * should no longer be used for further actions.
   * Note: In the case of a dirty tab, a confirmation dialog will be shown which may be cancelled. If cancelled the tab is still valid
   *
   * @param tab The tab to close.
   * @param preserveFocus When `true` focus will remain in its current position. If `false` it will jump to the next tab.
   * @returns A promise that resolves to `true` when all tabs have been closed.
   */
  close(tab: Tab | readonly Tab[], preserveFocus?: boolean): Promise<boolean>;

  /**
   * Closes the tab group. This makes the tab group object invalid and the tab group
   * should no longer be used for further actions.
   * @param tabGroup The tab group to close.
   * @param preserveFocus When `true` focus will remain in its current position.
   * @returns A promise that resolves to `true` when all tab groups have been closed.
   */
  close(
    tabGroup: TabGroup | readonly TabGroup[],
    preserveFocus?: boolean
  ): Promise<boolean>;
}

export class TabUtils {
  static tabAPIAvailable() {
    return semver.gte(vscodeVersion, "1.67.0");
  }

  static isPreviewTab(tab: Tab) {
    // label will look like this: mainThreadWebview-DendronNotePreview
    return (
      _.isString(tab.input?.viewType) &&
      tab.input.viewType.endsWith("DendronNotePreview")
    );
  }

  static getAllTabGroups() {
    return (window as any).tabGroups as TabGroups;
  }
}
