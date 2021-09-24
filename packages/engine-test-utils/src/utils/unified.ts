import { checkString } from ".";

export class TestUnifiedUtils {
  static verifyPrivateLink = ({
    contents,
    value,
  }: {
    contents: string;
    value: string;
  }) => {
    return checkString(contents, "color: brown", value + " (Private)");
  };
}
