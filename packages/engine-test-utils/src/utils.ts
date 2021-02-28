import { AssertUtils } from "@dendronhq/common-test-utils";

export async function checkString(body: string, ...match: string[]) {
  expect(
    await AssertUtils.assertInString({
      body,
      match,
    })
  ).toBeTruthy();
}
