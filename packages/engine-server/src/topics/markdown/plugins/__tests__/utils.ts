import { DNoteRefData, DNoteRefLink } from "@dendronhq/common-all";

export function createRefLink({
  fname,
  ...data
}: { fname: string } & DNoteRefData): DNoteRefLink {
  return {
    data: { ...data, type: "file" },
    from: {
      fname,
    },
    type: "ref",
  };
}
