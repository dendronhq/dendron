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
  };
}
