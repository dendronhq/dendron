import { AutoCompleter } from "../../utils/autoCompleter";
import { describe, it } from "mocha";
import { expect } from "../expect";
import { VSCodeUtils } from "../../vsCodeUtils";
import { TestNoteFactory } from "@dendronhq/common-test-utils";
import { NoteQuickInputV2 } from "@dendronhq/common-all";
import { DendronQuickPickerV2 } from "../../components/lookup/types";

const LANGUAGE_FNAMES = [
  "languages.python.data",
  "languages.python.data.string",
  "languages.with-data.make-sense",
  "languages.python.data.string",
  "languages.python.machine-learning.pandas",
  "languages.python.data.bool",
  "languages.python.data",
  "languages.python",
  "languages.with-data",
  // Note that this one starts with 'langrel' instead of language.
  "langrel.hello-world",
];

describe(`Auto Completer tests.`, () => {
  const noteFactory = TestNoteFactory.defaultUnitTestFactory();

  describe(`getNewQuickPickValue`, () => {
    describe(`WHEN we are at the first value of dropdown`, () => {
      it("THEN we should do partial completion", async () => {
        const quickPick =
          VSCodeUtils.createQuickPick<NoteQuickInputV2>() as DendronQuickPickerV2;
        const items = await noteFactory.createNoteInputWithFNames(
          LANGUAGE_FNAMES
        );

        quickPick.items = items;
        quickPick.activeItems = [items[0]];
        quickPick.value = "languages.pyt";

        const actual = AutoCompleter.getAutoCompletedValue(quickPick);

        expect(actual).toEqual("languages.python");
      });

      it("AND we have multiple files with same name at the top THEN allow partial completion", async () => {
        // This happens when we have multiple file names in different vaults
        const fnames = [
          "languages",
          "languages",
          "languages.python.data",
          "languages.python.data.string",
          "languages.with-data.make-sense",
        ];
        const quickPick =
          VSCodeUtils.createQuickPick<NoteQuickInputV2>() as DendronQuickPickerV2;
        const items = await noteFactory.createNoteInputWithFNames(fnames);

        quickPick.items = items;
        quickPick.activeItems = [items[0]];
        quickPick.value = "languages";

        const actual = AutoCompleter.getAutoCompletedValue(quickPick);

        expect(actual).toEqual("languages.python");
      });
    });

    describe(`WHEN we are at subsequent value of dropdown`, () => {
      it("THEN we should do full completion", async () => {
        const quickPick =
          VSCodeUtils.createQuickPick<NoteQuickInputV2>() as DendronQuickPickerV2;
        const items = await noteFactory.createNoteInputWithFNames(
          LANGUAGE_FNAMES
        );

        quickPick.items = items;
        quickPick.activeItems = [items[2]];
        quickPick.value = "languages.pyt";

        const actual = AutoCompleter.getAutoCompletedValue(quickPick);

        expect(actual).toEqual("languages.with-data.make-sense");
      });
    });
  });

  describe(`autoCompleteNoteLookup`, () => {
    describe(`GIVEN "language" file name input:`, () => {
      function testWithLanguageInput(
        input: string,
        expected: string,
        activeItemValue?: string
      ) {
        if (activeItemValue === undefined) {
          activeItemValue = input;
        }
        const actual = AutoCompleter.autoCompleteNoteLookup(
          input,
          activeItemValue,
          LANGUAGE_FNAMES
        );
        expect(actual).toEqual(expected);
      }

      describe(`WHEN active item is specified`, () => {
        it(`AND there is a match with input THEN return active item`, () => {
          testWithLanguageInput(
            "mach",
            "languages.python.machine-learning.pandas",
            "languages.python.machine-learning.pandas"
          );
        });

        it("AND there is NO match with the input THEN return active item", () => {
          testWithLanguageInput(
            "data",
            "languages.python.machine-learning.pandas",
            "languages.python.machine-learning.pandas"
          );
        });
      });

      describe(`Testing prefix auto completion (digging into hierarchy):`, () => {
        [
          ["lang", "languages"],
          ["languages", "languages.python"],
          ["languages.py", "languages.python"],
          ["languages.python", "languages.python.data"],
          ["languages.python.da", "languages.python.data"],
          // This is an important test case since it goes from first filename result to
          // second top pick file name result.
          ["languages.python.data", "languages.python.data.string"],
        ].forEach((testCase) => {
          const input = testCase[0];
          const expected = testCase[1];

          it(`WHEN '${input}' THEN expect: '${expected}'`, () => {
            testWithLanguageInput(input, expected);
          });
        });
      });

      describe(`Testing completion within the note`, () => {
        it(`WHEN matching 'pyth' THEN we should prepend the beginning of top pick`, () => {
          testWithLanguageInput("pyth", "languages.pyth");
        });
      });

      describe(`Testing unmatched`, () => {
        it("WHEN unmatched is attempted to auto complete THEN top pick return", () => {
          testWithLanguageInput("i-dont-match", "languages.python.data");
        });
      });

      describe(`Testing query characters`, () => {
        it("WHEN query characters are used THEN return top pick", () => {
          testWithLanguageInput("pyt hon", "languages.python.data");
        });
      });
    });

    describe(`GIVEN empty file name input`, () => {
      it(`WHEN auto complete is used with empty file names THEN return current value`, () => {
        expect(
          AutoCompleter.autoCompleteNoteLookup("hello", "hello", [])
        ).toEqual("hello");
      });
    });
  });
});
