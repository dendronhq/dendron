import assert from "assert";
import _ from "lodash";

function safeStringify(obj: any) {
  try {
    return JSON.stringify(obj);
  } catch (err) {
    return `failed_to_stringify_obj`;
  }
}

export function expect(value: any) {
  return {
    /**
     * NOTE: This method currently only works for checking object properties.
     *
     * Such as:
     * var object = { 'user': 'fred', 'age': 40 };
     * _.isMatch(object, { 'age': 40 });
     * // => true
     * _.isMatch(object, { 'age': 36 });
     * // => false
     * */
    toContain: (value2: any) => {
      assert.ok(
        _.isMatch(value, value2),
        `Object:'${safeStringify(value)}' does NOT contain: '${safeStringify(
          value2
        )}'`
      );
    },
    toEqual: (value2: any) => {
      assert.deepStrictEqual(value, value2);
    },
    toNotEqual: (value2: any) => {
      assert.notDeepStrictEqual(value, value2);
    },
    toBeTruthy: () => {
      assert.ok(value);
    },
    toBeFalsy: () => {
      assert.ok(_.isUndefined(value) || !value);
    },
    /**
     *  Pass examples:
     *  <pre>
     *  await expect(() => { throw new Error(); }).toThrow(); // Passes exception thrown
     *  await expect(() => { throw new Error(`hi world`); }).toThrow(`hi`); // Passes regex matches
     *  </pre>
     *
     *  Failure examples:
     *  <pre>
     *  await expect(() => {  }).toThrow(); // Fails (no exception thrown)
     *  await expect(() => { throw new Error(`hi`); }).toThrow(`hi world`); // Fails regex does not match
     *  </pre>
     * */
    toThrow: async (regex?: string) => {
      let threwException = false;

      try {
        await value();
      } catch (err) {
        threwException = true;

        if (regex)
          if (err instanceof Error) {
            if (err.message === undefined) {
              assert.fail(
                `Regex '${regex}' was specified but thrown error did not have a message`
              );
            }

            const matchArr = err.message.match(regex);

            assert.ok(
              matchArr !== null,
              `Thrown exception message did NOT match regex:'${regex}' ErrorMessage:'${err.message}'`
            );
          } else {
            assert.fail(
              `Regex '${regex}' was specified but non Error type was thrown.`
            );
          }
      }

      assert(
        threwException,
        `Expected exception to be thrown. None were thrown.`
      );
    },
  };
}
