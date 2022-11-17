/**
 * Responsible for picking out the auto completions.
 * */
import { FuseEngine } from "@dendronhq/common-all";
import * as _ from "lodash";
import { CREATE_NEW_DETAIL_LIST } from "../components/lookup/constants";
import { QuickPick, QuickPickItem } from "vscode";

export class AutoCompleter {
  /**
   * Auto complete note look up will do its best to add completions incrementally,
   * since if the user already found the result they want they can just press Enter.
   *
   * currentValue: currently entered into lookup.
   * activeItemValue: val of the item that is in focus in the list of possible items
   *                 (if nothing is in focus this should be equal to the current value).
   * fnames: the file names to choose completions from sorted by most likely matches first.
   * */
  static autoCompleteNoteLookup(
    currentValue: string,
    activeItemValue: string,
    fnames: string[]
  ) {
    if (fnames.length === 0) {
      return currentValue;
    }
    let topPickIdx = 0;

    if (currentValue !== activeItemValue && fnames.includes(activeItemValue)) {
      // If active item is not equal to the current value and it does exist in
      // file names then we can deem that its the item which is currently selected.
      //
      // Initial thoughts to tackle this scenario was to apply similar logic of auto
      // complete of attempting to incrementally auto complete using active item
      // as origin of partial completion (Eg. auto complete up to the part currentValue part
      // within the active item).
      //
      // However, doing some usability testing it proved rather annoying to have the selection
      // appear to drop after scrolling through a long list of items.
      // Example: in test workspace if typed 'la' and then scrolled down past all 'language' matches,
      // while hovering on top of 'templates.book.characters' when trying to do partial
      // completion it would complete to 'templa' and show all new results, with
      // 'templates.book.characters' not having any priority in those results. It appears to be
      // much smoother experience if we just auto complete to 'templates.book.characters' in such
      // cases. Which is just returning the currently focused item.

      return activeItemValue;
    }

    if (FuseEngine.doesContainSpecialQueryChars(currentValue)) {
      // If there are special query characters and auto complete is activated we will not
      // try to do anything fancy and just return the first top pick.
      return fnames[topPickIdx];
    }

    if (currentValue.length > fnames[topPickIdx].length) {
      // Not expecting length of current value to be larger than results
      // and still have file names suggested (unless it is special query characters
      // and we already took care of that case).
      //
      // For now just keep current value.
      return currentValue;
    }

    if (fnames[topPickIdx].startsWith(currentValue)) {
      // If the entered value matches the beginning of the top pick add to the auto complete
      // one hierarchy level at a time. Consecutive auto completes will allow user to dig
      // into the note hierarchy.

      if (fnames[topPickIdx] === currentValue) {
        // Auto complete was invoked on a value and top pick index is already matching the current
        // value we can presume that the user wants to dig deeper into the hierarchy, so if
        // there is a next value which allows us to dig deeper into the hierarchy we should allow it,
        // by picking the next suggestion as the top pick.
        if (
          topPickIdx < fnames.length - 1 &&
          fnames[topPickIdx + 1].startsWith(currentValue)
        ) {
          topPickIdx += 1;
        } else {
          return fnames[topPickIdx];
        }
      }

      return this.matchPrefixTillNextDot(fnames[topPickIdx], currentValue, 0);
    } else if (fnames[topPickIdx].includes(currentValue)) {
      // Add the beginning of the matching note to the auto complete, which should
      // allow the user to use matching into next hierarchy level.
      return this.matchNoteUpToCurrValue(fnames[topPickIdx], currentValue);
    } else {
      return fnames[topPickIdx];
    }
  }

  private static matchPrefixTillNextDot(
    topPick: string,
    value: string,
    minIdx: number
  ): string {
    const startSearchIdx = Math.max(value.length, minIdx);

    if (startSearchIdx >= topPick.length) {
      return topPick;
    }

    // Find next dot within the top pick
    const dotIdx = topPick.indexOf(".", startSearchIdx);
    if (dotIdx === -1) {
      // Did not find the next dot return the entire top pick.
      return topPick;
    } else if (dotIdx === value.length) {
      // There is a dot right after the current value inside the top pick
      // For example [val:languages, topPick:languages.python] and the user triggered
      // auto complete so we deem that user wanted to dig deeper into the
      // hierarchy level call the same function with incremented starting index.
      return this.matchPrefixTillNextDot(topPick, value, dotIdx + 1);
    } else {
      return topPick.substring(0, dotIdx);
    }
  }

  private static matchNoteUpToCurrValue(topPick: string, currentValue: string) {
    const idx = topPick.indexOf(currentValue);
    if (idx === -1) {
      // We did not find current value within the top pick.
      // Our easily accessible options: keep the current value, return the entire top pick.
      // Looking at IDE completions for inspiration: InteliJ will return the top pick if
      // there is a fuzzy match but not exact match so deeming it logical for now to return
      // top pick in this scenario.
      return topPick;
    } else {
      return topPick.substring(0, idx) + currentValue;
    }
  }

  static getAutoCompletedValue(
    _quickPick: QuickPick<QuickPickItem & { fname: string }>
  ): string {
    // Keep only distinct items since that allows us to move past multiple
    // same names in a row to allow digging deeper into note hierarchy.
    // Example:
    //   User typed value: 'languages'
    //   Items: [languages(vaultA), languages(vaultB), languages.python...)]
    // We want to be able to move past the duplicate language and auto complete to languages.python
    const fnames = _.uniq(
      _quickPick.items
        // Remove create new since it does not make sense for name auto completion.
        .filter((item) => !CREATE_NEW_DETAIL_LIST.includes(item.detail || ""))
        .map((item) => item.fname)
    );

    // Account for user selecting a file name with arrow keys
    let activeItemValue = _quickPick.value;
    if (_quickPick.activeItems.length >= 1) {
      const candidate = _quickPick.activeItems[0].fname;

      // Even if the user has not selected an item with arrow keys the focus
      // of the drop down will be on the first item hence we only want to switch
      // the active item if we detect that arrow key selection has happened.
      if (!_.isEqual(_quickPick.activeItems[0], _quickPick.items[0])) {
        activeItemValue = candidate;
      }
    }

    return AutoCompleter.autoCompleteNoteLookup(
      _quickPick.value,
      activeItemValue,
      fnames
    );
  }
}
